import { Router } from 'express';
import { reactionsController } from './reactions.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';
import { rejectGuest } from '../../middleware/guest.middleware.js';
import {
  createReactionSchema,
  updateReactionSchema,
  reactionParamsSchema,
} from './reactions.schema.js';

const router = Router({ mergeParams: true });

router.get('/', optionalAuth, reactionsController.getAll);

router.post(
  '/',
  authenticateUser,
  rejectGuest,
  validate({ body: createReactionSchema }),
  reactionsController.create
);

router.post(
  '/toggle',
  authenticateUser,
  rejectGuest,
  validate({ body: createReactionSchema }),
  reactionsController.toggle
);

router.patch(
  '/:reactionId',
  authenticateUser,
  rejectGuest,
  validate({ params: reactionParamsSchema, body: updateReactionSchema }),
  reactionsController.update
);

router.delete(
  '/:reactionId',
  authenticateUser,
  rejectGuest,
  validate({ params: reactionParamsSchema }),
  reactionsController.remove
);

export default router;
