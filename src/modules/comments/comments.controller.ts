import { Request, Response } from 'express';
import { commentsService } from './comments.service.js';
import type { UpdateCommentInput, CommentQueryInput } from './comments.schema.js';

export const commentsController = {
  async getAll(req: Request, res: Response) {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const query = req.query as unknown as CommentQueryInput;
    const result = await commentsService.getCommentsByProject(projectId as string, userId, query);
    res.status(200).json(result);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const { content, parentId, isOfficial } = req.body;
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const userId = user.id;

    // Only ADMIN or BARANGAY can set isOfficial
    const canSetOfficial = ['ADMIN', 'BARANGAY'].includes(user.role);
    const comment = await commentsService.createComment({
      content,
      userId,
      projectId: projectId as string,
      parentId,
      isOfficial: canSetOfficial ? isOfficial : false,
    });

    res.status(201).json({ success: true, data: comment });
  },

  async getReplies(req: Request, res: Response) {
    const { commentId } = req.params;
    const replies = await commentsService.getReplies(commentId as string);
    res.json({ success: true, data: replies });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { projectId, commentId } = req.params;
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const userId = user.id;
    const data = req.body as UpdateCommentInput;
    const comment = await commentsService.updateComment(projectId as string, commentId as string, userId, data);
    res.status(200).json(comment);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { projectId, commentId } = req.params;
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const userId = user.id;
    const userRole = user.role;
    const result = await commentsService.deleteComment(projectId as string, commentId as string, userId, userRole);
    res.status(200).json(result);
  },
};
