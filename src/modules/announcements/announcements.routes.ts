import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { announcementsController } from './announcements.controller.js';
import {
  listAnnouncementsSchema,
  announcementParamsSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from './announcements.schema.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: listAnnouncementsSchema }), announcementsController.getAll);
router.get('/:id', optionalAuth, validate({ params: announcementParamsSchema }), announcementsController.getById);

router.post(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ body: createAnnouncementSchema }),
  announcementsController.create
);

router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ params: announcementParamsSchema, body: updateAnnouncementSchema }),
  announcementsController.update
);

router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ params: announcementParamsSchema }),
  announcementsController.remove
);

export default router;
