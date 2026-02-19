import { Router } from 'express';
import { contactsController } from './contacts.controller.js';
import {
  createContactSchema,
  updateContactSchema,
  contactParamsSchema,
  listContactsSchema,
} from './contacts.schema.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: listContactsSchema.shape.query }), contactsController.getAll);
router.get('/:id', optionalAuth, validate({ params: contactParamsSchema }), contactsController.getById);
router.post('/', authenticateUser, validate({ body: createContactSchema.shape.body }), contactsController.create);
router.patch('/:id', authenticateUser, validate({ params: updateContactSchema.shape.params, body: updateContactSchema.shape.body }), contactsController.update);
router.delete('/:id', authenticateUser, validate({ params: contactParamsSchema }), contactsController.remove);

export default router;
