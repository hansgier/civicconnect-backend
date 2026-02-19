import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(50000),
    parentId: z.string().uuid().optional(),     // NEW: for replies
    isOfficial: z.boolean().optional(),          // NEW: admin-settable
  }),
  params: z.object({
    projectId: z.string().uuid(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(50000).optional(),
    isOfficial: z.boolean().optional(),          // NEW: admin-settable
  }),
  params: z.object({
    projectId: z.string().uuid(),
    commentId: z.string().uuid(),
  }),
});

export const commentParamsSchema = z.object({
  projectId: z.string().uuid(),
  commentId: z.string().uuid(),
});

export const commentProjectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>['body'];
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body'];
export type CommentParamsInput = z.infer<typeof commentParamsSchema>;
export type CommentProjectParamsInput = z.infer<typeof commentProjectParamsSchema>;

export const commentQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['content', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
