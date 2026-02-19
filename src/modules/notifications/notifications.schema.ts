import { z } from 'zod';
import { NotificationType } from '@prisma/client';

export const listNotificationsSchema = z.object({
  query: z.object({
    type: z.nativeEnum(NotificationType).optional(),
    read: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional().default(20),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
