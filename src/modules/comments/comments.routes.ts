import { Router } from 'express';
import { commentsController } from './comments.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';
import { rejectGuest } from '../../middleware/guest.middleware.js';
import {
  createCommentSchema,
  updateCommentSchema,
  commentParamsSchema,
  commentProjectParamsSchema,
  commentQuerySchema,
} from './comments.schema.js';

const router = Router({ mergeParams: true });

router.get('/', optionalAuth, validate({ params: commentProjectParamsSchema, query: commentQuerySchema }), commentsController.getAll);
router.get('/:commentId/replies', optionalAuth, commentsController.getReplies);

router.post(
  '/',
  authenticateUser,
  rejectGuest,
  validate({ body: createCommentSchema.shape.body }),
  commentsController.create
);

router.patch(
  '/:commentId',
  authenticateUser,
  rejectGuest,
  validate({
    params: updateCommentSchema.shape.params,
    body: updateCommentSchema.shape.body,
  }),
  commentsController.update
);

router.delete(
  '/:commentId',
  authenticateUser,
  rejectGuest,
  validate({ params: commentParamsSchema }),
  commentsController.remove
);

export default router;
