import { z } from 'zod';

export const createBarangaySchema = z.object({
  name: z.string().min(1).max(100),
  district: z.string().max(50).optional(),
  population: z.number().int().positive().optional(),
});

export const updateBarangaySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  district: z.string().max(50).optional(),
  population: z.number().int().positive().optional(),
});

export const barangayParamsSchema = z.object({
  id: z.string().uuid(),
});

export const barangayQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
  district: z.string().optional(),
});

export type CreateBarangayInput = z.infer<typeof createBarangaySchema>;
export type UpdateBarangayInput = z.infer<typeof updateBarangaySchema>;
export type BarangayParamsInput = z.infer<typeof barangayParamsSchema>;
export type BarangayQueryInput = z.infer<typeof barangayQuerySchema>;
