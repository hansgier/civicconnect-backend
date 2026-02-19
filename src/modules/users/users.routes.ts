import { Router } from 'express';
import { usersController } from './users.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateUserSchema, userParamsSchema, userQuerySchema } from './users.schema.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/', authorizeRoles('ADMIN'), validate({ query: userQuerySchema }), usersController.getAll);
router.get('/:id', validate({ params: userParamsSchema }), usersController.getById);
router.patch('/:id', validate({ params: userParamsSchema, body: updateUserSchema }), usersController.update);
router.delete('/:id', authorizeRoles('ADMIN'), validate({ params: userParamsSchema }), usersController.remove);

router.post(
  '/:id/avatar',
  upload.single('avatar'),
  usersController.uploadAvatar
);

// Profile data endpoints
router.get('/:id/liked-projects', usersController.getLikedProjects);
router.get('/:id/comments', usersController.getUserComments);
router.get('/:id/activity', usersController.getUserActivity);
router.get('/:id/stats', usersController.getUserStats);

export default router;
