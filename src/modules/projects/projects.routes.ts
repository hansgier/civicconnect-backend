import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { projectsController } from './projects.controller.js';
import {
  projectQuerySchema,
  projectParamsSchema,
  createProjectSchema,
  updateProjectSchema,
} from './projects.schema.js';
import updatesRouter from '../updates/updates.routes.js';
import { projectMediaRouter } from '../media/media.routes.js';
import commentsRouter from '../comments/comments.routes.js';
import reactionsRouter from '../reactions/reactions.routes.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: projectQuerySchema }), projectsController.getAll);
router.get('/:id', optionalAuth, validate({ params: projectParamsSchema }), projectsController.getById);
router.post(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  validate({ body: createProjectSchema }),
  projectsController.create
);
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  validate({ params: projectParamsSchema, body: updateProjectSchema }),
  projectsController.update
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  validate({ params: projectParamsSchema }),
  projectsController.remove
);
router.delete(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY'),
  projectsController.removeAll
);

router.use('/:projectId/updates', updatesRouter);
router.use('/:projectId/media', projectMediaRouter);
router.use('/:projectId/comments', commentsRouter);
router.use('/:projectId/reactions', reactionsRouter);

export default router;
