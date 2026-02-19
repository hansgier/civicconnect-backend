import { z } from 'zod';
import { ROLES, USER_STATUSES } from '../../shared/constants/index.js';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  barangayId: z.string().uuid().nullable().optional(),
  role: z.nativeEnum(ROLES).optional(),
  status: z.nativeEnum(USER_STATUSES).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const userParamsSchema = z.object({
  id: z.string().uuid(),
});

export const userQuerySchema = z.object({
  role: z.nativeEnum(ROLES).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  barangayId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'email', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
