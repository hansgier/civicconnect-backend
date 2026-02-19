import { z } from 'zod';
import { ContactType } from '@prisma/client';

export const createContactSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    phoneNumbers: z.array(z.string()).min(1),
    primaryPhone: z.string().optional(),
    emails: z.array(z.string().email()).default([]),
    schedule: z.string().max(200).optional(),
    location: z.string().max(500).optional(),
    type: z.nativeEnum(ContactType),
    isEmergency: z.boolean().optional().default(false),
    order: z.number().int().optional(),
  }),
});

export const updateContactSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    phoneNumbers: z.array(z.string()).min(1).optional(),
    primaryPhone: z.string().optional().nullable(),
    emails: z.array(z.string().email()).optional(),
    schedule: z.string().max(200).optional().nullable(),
    location: z.string().max(500).optional().nullable(),
    type: z.nativeEnum(ContactType).optional(),
    isEmergency: z.boolean().optional(),
    order: z.number().int().optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listContactsSchema = z.object({
  query: z.object({
    type: z.nativeEnum(ContactType).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['title', 'type', 'createdAt']).optional().default('title'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().max(100).optional(),
  }),
});

export const contactParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>['body'];
export type UpdateContactInput = z.infer<typeof updateContactSchema>['body'];
export type ContactParamsInput = z.infer<typeof contactParamsSchema>;
export type ListContactsQuery = z.infer<typeof listContactsSchema>['query'];
