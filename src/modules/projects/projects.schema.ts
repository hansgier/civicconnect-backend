import { z } from 'zod';
import { ProjectStatus, ProjectCategory } from '@prisma/client';

export const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  cost: z.number().positive(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(ProjectStatus).default('PLANNED'),
  category: z.nativeEnum(ProjectCategory),
  implementingAgency: z.string().max(255).optional(),
  contractor: z.string().max(255).optional(),
  fundingSourceId: z.string().uuid().optional(),
  barangayIds: z.array(z.string().uuid()).min(1),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  category: z.nativeEnum(ProjectCategory).optional().nullable(),
  implementingAgency: z.string().max(255).optional(),
  contractor: z.string().max(255).optional(),
  fundingSourceId: z.string().uuid().optional(),
  barangayIds: z.array(z.string().uuid()).min(1).optional(),
  completionDate: z.string().datetime().optional(),
});

export const projectParamsSchema = z.object({
  id: z.string().uuid(),
});

export const projectQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  category: z.nativeEnum(ProjectCategory).optional(),
  barangayId: z.string().uuid().optional(),
  search: z.string().optional(),
  fundingSourceId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'title', 'cost', 'startDate', 'dueDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectParamsInput = z.infer<typeof projectParamsSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
