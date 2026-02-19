import { Request, Response } from 'express';
import { reactionsService } from './reactions.service.js';
import type { CreateReactionInput, UpdateReactionInput } from './reactions.schema.js';

export const reactionsController = {
  async getAll(req: Request, res: Response) {
    const { projectId } = req.params;
    const result = await reactionsService.getReactionsByProject(projectId as string);
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const { projectId } = req.params;
    const user = req.user as { id: string };
    const userId = user.id;
    const data = req.body as CreateReactionInput;
    const reaction = await reactionsService.createReaction(projectId as string, userId, data);
    res.status(201).json(reaction);
  },

  async update(req: Request, res: Response) {
    const { reactionId } = req.params;
    const user = req.user as { id: string };
    const userId = user.id;
    const data = req.body as UpdateReactionInput;
    const reaction = await reactionsService.updateReaction(reactionId as string, userId, data);
    res.status(200).json(reaction);
  },

  async remove(req: Request, res: Response) {
    const { reactionId } = req.params;
    const user = req.user as { id: string };
    const userId = user.id;
    await reactionsService.deleteReaction(reactionId as string, userId);
    res.status(200).json({ success: true });
  },

  async toggle(req: Request, res: Response) {
    const { projectId } = req.params;
    const user = req.user as { id: string };
    const userId = user.id;
    const { type, commentId } = req.body as CreateReactionInput;

    if (commentId) {
      const result = await reactionsService.toggleCommentReaction(projectId as string, userId, commentId, type);
      res.status(200).json(result);
    } else {
      const result = await reactionsService.toggleProjectReaction(projectId as string, userId, type);
      res.status(200).json(result);
    }
  },
};
