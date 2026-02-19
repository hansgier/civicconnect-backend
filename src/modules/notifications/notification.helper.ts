import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { getIO } from '../../socket/index.js';

interface CreateNotificationInput {
  title: string;
  description: string;
  type: NotificationType;
  userId: string;         // recipient
  projectId?: string;
  announcementId?: string;
}

/**
 * Creates a notification in the database and emits it via Socket.io.
 * Used by other services to trigger notifications.
 */
export async function createAndEmitNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      userId: input.userId,
      projectId: input.projectId,
      announcementId: input.announcementId,
    },
  });

  // Emit via Socket.io to the recipient's room
  try {
    const io = getIO();
    io.to(`user:${input.userId}`).emit('notification:new', notification);
  } catch {
    // Socket.io not initialized (e.g., in tests) — skip silently
  }

  return notification;
}

/**
 * Creates notifications for multiple recipients.
 * Useful for broadcast notifications (e.g., new announcement).
 */
export async function createBulkNotifications(
  inputs: CreateNotificationInput[]
) {
  const notifications = await prisma.notification.createMany({
    data: inputs.map((input) => ({
      title: input.title,
      description: input.description,
      type: input.type,
      userId: input.userId,
      projectId: input.projectId,
      announcementId: input.announcementId,
    })),
  });

  // Emit individually to each recipient's room
  try {
    const io = getIO();
    for (const input of inputs) {
      io.to(`user:${input.userId}`).emit('notification:new', {
        title: input.title,
        description: input.description,
        type: input.type,
        projectId: input.projectId,
        announcementId: input.announcementId,
      });
    }
  } catch {
    // Socket.io not initialized — skip silently
  }

  return notifications;
}
