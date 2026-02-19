import { Router } from 'express';
import { fundingSourcesController } from './funding-sources.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import {
  createFundingSourceSchema,
  updateFundingSourceSchema,
  fundingSourceParamsSchema,
} from './funding-sources.schema.js';

const router = Router();

router.use(authenticateUser);

router.get('/', fundingSourcesController.getAll);
router.get(
  '/:id',
  validate({ params: fundingSourceParamsSchema }),
  fundingSourcesController.getById
);

router.post(
  '/',
  authorizeRoles('ADMIN'),
  validate({ body: createFundingSourceSchema }),
  fundingSourcesController.create
);

router.patch(
  '/:id',
  authorizeRoles('ADMIN'),
  validate({ params: fundingSourceParamsSchema, body: updateFundingSourceSchema }),
  fundingSourcesController.update
);

router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  validate({ params: fundingSourceParamsSchema }),
  fundingSourcesController.remove
);

export default router;
