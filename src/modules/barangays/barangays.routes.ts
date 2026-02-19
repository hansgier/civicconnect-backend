import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { barangaysController } from './barangays.controller.js';
import {
  barangayQuerySchema,
  barangayParamsSchema,
  createBarangaySchema,
  updateBarangaySchema,
} from './barangays.schema.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: barangayQuerySchema }), barangaysController.getAll);
router.get('/:id', optionalAuth, validate({ params: barangayParamsSchema }), barangaysController.getById);
router.post(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN'),
  validate({ body: createBarangaySchema }),
  barangaysController.create
);
router.patch(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN'),
  validate({ params: barangayParamsSchema, body: updateBarangaySchema }),
  barangaysController.update
);
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN'),
  validate({ params: barangayParamsSchema }),
  barangaysController.remove
);

export default router;
