import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/errors.js';
import { invalidateCache } from '../../shared/utils/cache.js';
import { sanitizeContent } from '../../shared/utils/sanitize-html.js';
import { createAndEmitNotification } from '../notifications/notification.helper.js';
import type { UpdateCommentInput, CommentQueryInput } from './comments.schema.js';
import { Prisma, UserRole } from '@prisma/client';

export class CommentsService {
  async getCommentsByProject(projectId: string, userId?: string, query: CommentQueryInput = { sortBy: 'createdAt', sortOrder: 'desc' }) {
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const search = query.search;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const where: Prisma.CommentWhereInput = { projectId, parentId: null };
    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    // Fetch only top-level comments (parentId is null)
    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
            _count: { select: { reactions: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { reactions: true, replies: true } },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    // Add like counts and userHasLiked per comment
    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const [likes, userReaction] = await Promise.all([
          prisma.reaction.count({
            where: { commentId: comment.id, type: 'LIKE' },
          }),
          userId ? prisma.reaction.findUnique({
            where: { userId_commentId: { userId, commentId: comment.id } }
          }) : null
        ]);
        
        // Also add likes for replies
        const repliesWithLikes = await Promise.all(
          comment.replies.map(async (reply) => {
            const [replyLikes, replyUserReaction] = await Promise.all([
              prisma.reaction.count({
                where: { commentId: reply.id, type: 'LIKE' },
              }),
              userId ? prisma.reaction.findUnique({
                where: { userId_commentId: { userId, commentId: reply.id } }
              }) : null
            ]);
            return { 
              ...reply, 
              likes: replyLikes, 
              userHasLiked: replyUserReaction !== null 
            };
          })
        );

        return { 
          ...comment, 
          replies: repliesWithLikes, 
          likes, 
          userHasLiked: userReaction !== null 
        };
      })
    );

    return { comments: commentsWithLikes };
  }

  async createComment(data: {
    content: string;
    userId: string;
    projectId: string;
    parentId?: string;
    isOfficial?: boolean;
  }) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // If parentId is provided, validate it exists and belongs to the same project
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) throw new NotFoundError('Parent comment not found');
      if (parent.projectId !== data.projectId) {
        throw new BadRequestError('Parent comment does not belong to this project');
      }
      if (parent.parentId !== null) {
        throw new BadRequestError('Replies to replies are not allowed. You can only reply to top-level comments.');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: sanitizeContent(data.content),
        userId: data.userId,
        projectId: data.projectId,
        parentId: data.parentId ?? null,
        isOfficial: data.isOfficial ?? false,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    if (project && project.createdById !== data.userId) {
      await createAndEmitNotification({
        title: `New comment on "${project.title}"`,
        description: comment.content.substring(0, 100),
        type: 'COMMENT',
        userId: project.createdById,
        projectId: comment.projectId,
      });
    }

    // If it's a reply, also notify the parent comment author
    if (comment.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: comment.parentId },
        select: { userId: true },
      });
      if (parent && parent.userId !== data.userId) {
        await createAndEmitNotification({
          title: `New reply to your comment`,
          description: comment.content.substring(0, 100),
          type: 'COMMENT',
          userId: parent.userId,
          projectId: comment.projectId,
        });
      }
    }

    // Invalidate ALL project list caches to ensure comment counts are fresh
    invalidateCache('projects:*');
    invalidateCache('dashboard:*');

    return comment;
  }

  async getReplies(commentId: string) {
    return prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        _count: { select: { reactions: true, replies: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateComment(projectId: string, commentId: string, userId: string, data: UpdateCommentInput) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenError('You can only update your own comments');
    }

    if (comment.projectId !== projectId) {
      throw new NotFoundError('Comment does not belong to this project');
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { 
        content: data.content !== undefined ? sanitizeContent(data.content) : undefined,
        isOfficial: data.isOfficial,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    return updatedComment;
  }

  async deleteComment(projectId: string, commentId: string, userId: string, userRole: UserRole) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.projectId !== projectId) {
      throw new NotFoundError('Comment does not belong to this project');
    }

    const isAdmin = userRole === UserRole.ADMIN;
    const isOwner = comment.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError('You do not have permission to delete this comment');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Invalidate ALL project list caches to ensure comment counts are fresh
    invalidateCache('projects:*');
    invalidateCache('dashboard:*');

    return { success: true, message: 'Comment deleted successfully' };
  }
}

export const commentsService = new CommentsService();
