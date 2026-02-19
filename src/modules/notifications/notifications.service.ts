import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination.js';
import { NotFoundError } from '../../shared/errors/errors.js';

class NotificationsService {
  async getNotifications(
    userId: string,
    filters?: { type?: NotificationType; read?: boolean },
    pagination?: { page?: number; limit?: number }
  ) {
    const where: Prisma.NotificationWhereInput = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.read !== undefined) where.read = filters.read;

    const paginationData = parsePagination(pagination);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: paginationData.skip,
        take: paginationData.take,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: buildPaginationMeta(total, paginationData.page, paginationData.limit),
    };
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundError('Notification not found');
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundError('Notification not found');
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    return prisma.notification.delete({ where: { id } });
  }
}

export const notificationsService = new NotificationsService();
