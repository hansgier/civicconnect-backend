import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/errors.js';
import { sanitizeContent } from '../../shared/utils/sanitize-html.js';
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementQuery,
} from './announcements.schema.js';
import { createBulkNotifications } from '../notifications/notification.helper.js';

export class AnnouncementsService {
  async getAllAnnouncements(query: AnnouncementQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.isUrgent !== undefined) {
      where.isUrgent = query.isUrgent === 'true';
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAnnouncementById(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return announcement;
  }

  async createAnnouncement(data: CreateAnnouncementInput, userId: string) {
    const announcement = await prisma.announcement.create({
      data: {
        ...data,
        content: sanitizeContent(data.content),
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Notify all active users
    const activeUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE', id: { not: userId } },
      select: { id: true },
    });

    await createBulkNotifications(
      activeUsers.map((user) => ({
        title: `New announcement: "${announcement.title}"`,
        description: announcement.excerpt ?? announcement.content.substring(0, 100),
        type: 'ANNOUNCEMENT' as const,
        userId: user.id,
        announcementId: announcement.id,
      }))
    );

    return announcement;
  }

  async updateAnnouncement(id: string, data: UpdateAnnouncementInput, userId: string, userRole: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    // Authorization: author can edit own, admin can edit any
    if (announcement.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You are not authorized to update this announcement');
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        content: data.content !== undefined ? sanitizeContent(data.content) : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteAnnouncement(id: string, userId: string, userRole: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    // Authorization: author can delete own, admin can delete any
    if (announcement.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You are not authorized to delete this announcement');
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return { success: true };
  }
}

export const announcementsService = new AnnouncementsService();
