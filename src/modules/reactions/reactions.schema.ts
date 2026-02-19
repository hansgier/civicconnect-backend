import { z } from 'zod';
import { ReactionType } from '@prisma/client';

export const createReactionSchema = z.object({
  type: z.nativeEnum(ReactionType),
  commentId: z.string().uuid().optional(),
});

export const updateReactionSchema = z.object({
  type: z.nativeEnum(ReactionType),
});

export const reactionParamsSchema = z.object({
  projectId: z.string().uuid(),
  reactionId: z.string().uuid(),
});

export const reactionProjectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export type CreateReactionInput = z.infer<typeof createReactionSchema>;
export type UpdateReactionInput = z.infer<typeof updateReactionSchema>;
export type ReactionParamsInput = z.infer<typeof reactionParamsSchema>;
export type ReactionProjectParamsInput = z.infer<typeof reactionProjectParamsSchema>;
