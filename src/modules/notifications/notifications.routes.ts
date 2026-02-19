import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { listNotificationsSchema, notificationIdSchema } from './notifications.schema.js';

const router = Router();

// All notification routes require authentication
router.use(authenticateUser);

router.get('/', validate({ query: listNotificationsSchema.shape.query }), notificationsController.getAll);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/:id/read', validate({ params: notificationIdSchema.shape.params }), notificationsController.markAsRead);
router.patch('/read-all', notificationsController.markAllAsRead);
router.delete('/:id', validate({ params: notificationIdSchema.shape.params }), notificationsController.delete);

export default router;
