import { z } from 'zod';

export const createUpdateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const updateUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const updateParamsSchema = z.object({
  projectId: z.string().uuid(),
  id: z.string().uuid(),
});

export const updateProjectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const updateQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['title', 'date', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;
export type UpdateUpdateInput = z.infer<typeof updateUpdateSchema>;
export type UpdateParamsInput = z.infer<typeof updateParamsSchema>;
export type UpdateProjectParamsInput = z.infer<typeof updateProjectParamsSchema>;
export type UpdateQueryInput = z.infer<typeof updateQuerySchema>;
