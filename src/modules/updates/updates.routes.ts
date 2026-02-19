import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updatesController } from './updates.controller.js';
import {
  updateProjectParamsSchema,
  updateParamsSchema,
  createUpdateSchema,
  updateUpdateSchema,
  updateQuerySchema,
} from './updates.schema.js';

const router = Router({ mergeParams: true });

router.use(authenticateUser);

router.get(
  '/',
  validate({ params: updateProjectParamsSchema, query: updateQuerySchema }),
  updatesController.getAll
);
router.post(
  '/',
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ params: updateProjectParamsSchema, body: createUpdateSchema }),
  updatesController.create
);
router.patch(
  '/:id',
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ params: updateParamsSchema, body: updateUpdateSchema }),
  updatesController.update
);
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ params: updateParamsSchema }),
  updatesController.remove
);
router.delete(
  '/',
  authorizeRoles('ADMIN', 'BARANGAY'),
  validate({ params: updateProjectParamsSchema }),
  updatesController.removeAll
);

export default router;
