import { Router } from 'express';
import { systemController } from './system.controller.js';
// import { authenticateUser } from '../../middleware/auth.middleware.js';
// import { authorizeRoles } from '../../middleware/authorize.middleware.js';

const router = Router();

// Protect this endpoint - only admins can run the seed
router.post('/seed', systemController.runSeed);

export default router;
