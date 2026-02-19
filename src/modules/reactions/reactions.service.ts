import { ReactionType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors/errors.js';
import { invalidateCache } from '../../shared/utils/cache.js';
import { createAndEmitNotification } from '../notifications/notification.helper.js';
import type { CreateReactionInput, UpdateReactionInput } from './reactions.schema.js';

export class ReactionsService {
  async getReactionsByProject(projectId: string) {
    const reactions = await prisma.reaction.findMany({
      where: { projectId, commentId: null },
    });

    const likes = reactions.filter((r) => r.type === ReactionType.LIKE).length;
    const dislikes = reactions.filter((r) => r.type === ReactionType.DISLIKE).length;
    const userReactions = reactions.map((r) => ({
      userId: r.userId,
      type: r.type,
      reactionId: r.id,
    }));

    return { likes, dislikes, userReactions };
  }

  async createReaction(projectId: string, userId: string, data: CreateReactionInput) {
    const { type, commentId } = data;

    if (commentId) {
      // Comment-level reaction
      const existing = await prisma.reaction.findUnique({
        where: {
          userId_commentId: { userId, commentId },
        },
      });

      if (existing) {
        throw new ConflictError('Already reacted, use PATCH to change');
      }

      const reaction = await prisma.reaction.create({
        data: {
          type,
          userId,
          commentId,
        },
      });

      // Invalidate ALL project list caches to ensure reaction counts are fresh
      invalidateCache('projects:*');
      invalidateCache('dashboard:*');
      return reaction;
    } else {
      // Project-level reaction
      const existing = await prisma.reaction.findUnique({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      if (existing) {
        throw new ConflictError('Already reacted, use PATCH to change');
      }

      const reaction = await prisma.reaction.create({
        data: {
          type,
          userId,
          projectId,
        },
      });

      if (reaction.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: reaction.projectId },
          select: { title: true, createdById: true },
        });

        if (project && project.createdById !== userId) {
          await createAndEmitNotification({
            title: `New ${reaction.type === 'LIKE' ? 'approval' : 'disapproval'} on "${project.title}"`,
            description: `A user ${reaction.type === 'LIKE' ? 'approved' : 'disapproved'} your project.`,
            type: 'APPROVAL',
            userId: project.createdById,
            projectId: reaction.projectId,
          });
        }
      }

      // Invalidate ALL project list caches to ensure reaction counts are fresh
      invalidateCache('projects:*');
      invalidateCache('dashboard:*');
      return reaction;
    }
  }

  async updateReaction(reactionId: string, userId: string, data: UpdateReactionInput) {
    const reaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    });

    if (!reaction) {
      throw new NotFoundError('Reaction not found');
    }

    if (reaction.userId !== userId) {
      throw new ForbiddenError('You can only update your own reactions');
    }

    const updatedReaction = await prisma.reaction.update({
      where: { id: reactionId },
      data: { type: data.type },
    });

    if (reaction.projectId) {
      invalidateCache('projects:*');
      invalidateCache('dashboard:*');
    } else if (reaction.commentId) {
        invalidateCache('projects:*');
        invalidateCache('dashboard:*');
    }

    return updatedReaction;
  }

  async deleteReaction(reactionId: string, userId: string) {
    const reaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
    });

    if (!reaction) {
      throw new NotFoundError('Reaction not found');
    }

    if (reaction.userId !== userId) {
      throw new ForbiddenError('You can only delete your own reactions');
    }

    await prisma.reaction.delete({
      where: { id: reactionId },
    });

    if (reaction.projectId) {
      invalidateCache('projects:*');
      invalidateCache('dashboard:*');
    } else if (reaction.commentId) {
        invalidateCache('projects:*');
        invalidateCache('dashboard:*');
    }

    return { success: true };
  }

  async toggleCommentReaction(projectId: string, userId: string, commentId: string, type: ReactionType) {
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existing) {
      if (existing.type === type) {
        // Same type: Unlike/Undislike
        await prisma.reaction.delete({
          where: { id: existing.id },
        });
        invalidateCache('projects:*');
        invalidateCache('dashboard:*');
        return { action: 'deleted' };
      } else {
        // Different type: Update
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
        invalidateCache('projects:*');
        invalidateCache('dashboard:*');
        return { action: 'updated', data: updated };
      }
    }

    // New reaction
    const created = await prisma.reaction.create({
      data: {
        type,
        userId,
        commentId,
      },
    });

    // Notification for comment reaction
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, content: true },
    });

    if (comment && comment.userId !== userId) {
      await createAndEmitNotification({
        title: `Someone ${type === 'LIKE' ? 'liked' : 'disliked'} your comment`,
        description: comment.content.substring(0, 100),
        type: 'APPROVAL',
        userId: comment.userId,
        projectId: projectId,
      });
    }

    invalidateCache(`projects:${projectId}:*`);
    invalidateCache('dashboard:*');
    return { action: 'created', data: created };
  }

  async toggleProjectReaction(projectId: string, userId: string, type: ReactionType) {
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (existing) {
      if (existing.type === type) {
        // Same type: Unlike/Undislike
        await prisma.reaction.delete({
          where: { id: existing.id },
        });
        invalidateCache('projects:*');
        invalidateCache('dashboard:*');
        return { action: 'deleted' };
      } else {
        // Different type: Update
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
        invalidateCache('projects:*');
        invalidateCache('dashboard:*');
        return { action: 'updated', data: updated };
      }
    }

    // New reaction
    const created = await prisma.reaction.create({
      data: {
        type,
        userId,
        projectId,
      },
    });
    
    // Notification for project like
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true, createdById: true },
    });

    if (project && project.createdById !== userId) {
      await createAndEmitNotification({
        title: `New ${type === 'LIKE' ? 'approval' : 'disapproval'} on "${project.title}"`,
        description: `A user ${type === 'LIKE' ? 'approved' : 'disapproved'} your project.`,
        type: 'APPROVAL',
        userId: project.createdById,
        projectId: projectId,
      });
    }

    invalidateCache(`projects:${projectId}:*`);
    invalidateCache('dashboard:*');
    return { action: 'created', data: created };
  }
}

export const reactionsService = new ReactionsService();
