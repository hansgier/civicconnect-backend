import { z } from 'zod';
import { AnnouncementCategory } from '@prisma/client';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  image: z.string().url().optional(),
  category: z.nativeEnum(AnnouncementCategory),
  isUrgent: z.boolean().optional().default(false),
  location: z.string().max(200).optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  image: z.string().url().optional().nullable(),
  category: z.nativeEnum(AnnouncementCategory).optional().nullable(),
  isUrgent: z.boolean().optional(),
  location: z.string().max(200).optional().nullable(),
});

export const announcementParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listAnnouncementsSchema = z.object({
  category: z.nativeEnum(AnnouncementCategory).optional(),
  isUrgent: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
  sortBy: z.enum(['title', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementParams = z.infer<typeof announcementParamsSchema>;
export type AnnouncementQuery = z.infer<typeof listAnnouncementsSchema>;
