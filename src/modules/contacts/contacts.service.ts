import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/errors.js';
import { UserRole, Prisma } from '@prisma/client';
import type { CreateContactInput, UpdateContactInput, ListContactsQuery } from './contacts.schema.js';

export class ContactsService {
  async getAllContacts(filters?: ListContactsQuery) {
    const where: Prisma.ContactWhereInput = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { phoneNumbers: { has: filters.search } },
      ];
    }

    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 100;
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
            where,
            orderBy: { [filters?.sortBy ?? 'title']: filters?.sortOrder ?? 'asc' },
            skip,
            take: limit,
            include: {
              createdBy: {
                select: { id: true, name: true, avatar: true },
              },
            },
          }),
          prisma.contact.count({ where })
    ]);

    return {
        contacts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
  }

  async getContactById(id: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    return contact;
  }

  async createContact(data: CreateContactInput & { createdById: string }) {
    // If primaryPhone not set, default to first phone number
    const primaryPhone = data.primaryPhone ?? data.phoneNumbers[0];

    return prisma.contact.create({
      data: {
        title: data.title,
        description: data.description,
        phoneNumbers: data.phoneNumbers,
        primaryPhone,
        emails: data.emails ?? [],
        schedule: data.schedule,
        location: data.location,
        type: data.type,
        isEmergency: data.isEmergency ?? false,
        order: data.order,
        createdById: data.createdById,
      },
    });
  }

  async updateContact(id: string, data: UpdateContactInput, userId: string, userRole: UserRole) {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Authorization: creator or admin
    if (contact.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Not authorized to update this contact');
    }

    return prisma.contact.update({
      where: { id },
      data: {
          ...data,
          phoneNumbers: data.phoneNumbers ? data.phoneNumbers : undefined,
          emails: data.emails ? data.emails : undefined
      },
    });
  }

  async deleteContact(id: string, userId: string, userRole: UserRole) {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Authorization: creator or admin
    if (contact.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Not authorized to delete this contact');
    }

    await prisma.contact.delete({
      where: { id },
    });

    return { success: true };
  }
}

export const contactsService = new ContactsService();
