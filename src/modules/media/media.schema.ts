import { z } from 'zod';

export const mediaParamsSchema = z.object({
  id: z.string().uuid(),
});

export const projectMediaParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export type MediaParamsInput = z.infer<typeof mediaParamsSchema>;
export type ProjectMediaParamsInput = z.infer<typeof projectMediaParamsSchema>;
