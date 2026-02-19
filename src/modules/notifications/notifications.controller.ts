import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export const notificationsController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const userId = user.id;
    const { type, read, page, limit } = req.query;

    const result = await notificationsService.getNotifications(
      userId,
      {
        type: type as any,
        read: read === 'true' ? true : read === 'false' ? false : undefined,
      },
      { page: Number(page) || 1, limit: Number(limit) || 20 }
    );

    res.json({ success: true, ...result });
  }),

  getUnreadCount: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const count = await notificationsService.getUnreadCount(user.id);
    res.json({ success: true, data: { count } });
  }),

  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const id = req.params.id as string;
    const notification = await notificationsService.markAsRead(
      id,
      user.id
    );
    res.json({ success: true, data: notification });
  }),

  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const result = await notificationsService.markAllAsRead(user.id);
    res.json({ success: true, data: { updated: result.count } });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const id = req.params.id as string;
    await notificationsService.deleteNotification(id, user.id);
    res.json({ success: true, message: 'Notification deleted' });
  }),
};
