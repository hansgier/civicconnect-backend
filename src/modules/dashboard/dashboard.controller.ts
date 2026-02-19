import type { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export const dashboardController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats });
  }),

  getProjectTrends: asyncHandler(async (req: Request, res: Response) => {
    const months = Number(req.query.months) || 12;
    const trends = await dashboardService.getProjectTrends(months);
    res.json({ success: true, data: trends });
  }),

  getEngagementTrends: asyncHandler(async (req: Request, res: Response) => {
    const months = Number(req.query.months) || 12;
    const trends = await dashboardService.getEngagementTrends(months);
    res.json({ success: true, data: trends });
  }),

  getTopProjects: asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    const projects = await dashboardService.getTopProjects(limit);
    res.json({ success: true, data: projects });
  }),

  getWorstProjects: asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 5;
    const projects = await dashboardService.getWorstProjects(limit);
    res.json({ success: true, data: projects });
  }),

  getStatusTrends: asyncHandler(async (req: Request, res: Response) => {
    const months = Number(req.query.months) || 12;
    const trends = await dashboardService.getStatusTrends(months);
    res.json({ success: true, data: trends });
  }),
};
