import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/authorize.middleware.js';
import { uploadImages } from '../../middleware/upload.middleware.js';
import { mediaController } from './media.controller.js';
import { mediaParamsSchema } from './media.schema.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

router.post(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  uploadImages,
  mediaController.upload
);

const projectMediaRouter = Router({ mergeParams: true });

projectMediaRouter.use(authenticateUser);

projectMediaRouter.get('/', mediaController.getByProject);

projectMediaRouter.patch(
  '/',
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  uploadImages,
  mediaController.updateProjectMedia
);

projectMediaRouter.delete(
  '/',
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  mediaController.removeAll
);

projectMediaRouter.delete(
  '/:id',
  authorizeRoles('ADMIN', 'BARANGAY', 'ASSISTANT_ADMIN'),
  validate({ params: mediaParamsSchema }),
  mediaController.remove
);

export { router as mediaRouter, projectMediaRouter };
