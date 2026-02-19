import { z } from 'zod';

export const createFundingSourceSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateFundingSourceSchema = z.object({
  name: z.string().min(1).max(255),
});

export const fundingSourceParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateFundingSourceInput = z.infer<typeof createFundingSourceSchema>;
export type UpdateFundingSourceInput = z.infer<typeof updateFundingSourceSchema>;
export type FundingSourceParams = z.infer<typeof fundingSourceParamsSchema>;
