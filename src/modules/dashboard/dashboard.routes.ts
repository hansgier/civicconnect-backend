import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { optionalAuth } from '../../middleware/optional-auth.middleware.js';

const router = Router();

// All dashboard routes are public (optionalAuth for optional user context)
router.use(optionalAuth);

router.get('/stats', dashboardController.getStats);
router.get('/project-trends', dashboardController.getProjectTrends);
router.get('/engagement-trends', dashboardController.getEngagementTrends);
router.get('/top-projects', dashboardController.getTopProjects);
router.get('/worst-projects', dashboardController.getWorstProjects);
router.get('/status-trends', dashboardController.getStatusTrends);

export default router;
