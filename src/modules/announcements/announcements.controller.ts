import { Request, Response } from 'express';
import { announcementsService } from './announcements.service.js';
import type {
  AnnouncementQuery,
  AnnouncementParams,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './announcements.schema.js';

export class AnnouncementsController {
  async getAll(req: Request, res: Response) {
    const query = req.query as unknown as AnnouncementQuery;
    const result = await announcementsService.getAllAnnouncements(query);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response) {
    const params = req.params as unknown as AnnouncementParams;
    const announcement = await announcementsService.getAnnouncementById(params.id);
    res.status(200).json({ announcement });
  }

  async create(req: Request, res: Response) {
    const data = req.body as CreateAnnouncementInput;
    const user = req.user!;
    const userId = user.id;
    const announcement = await announcementsService.createAnnouncement(data, userId);
    res.status(201).json({ announcement });
  }

  async update(req: Request, res: Response) {
    const params = req.params as unknown as AnnouncementParams;
    const data = req.body as UpdateAnnouncementInput;
    const user = req.user!;
    const { id: userId, role: userRole } = user;
    const announcement = await announcementsService.updateAnnouncement(params.id, data, userId, userRole);
    res.status(200).json({ announcement });
  }

  async remove(req: Request, res: Response) {
    const params = req.params as unknown as AnnouncementParams;
    const user = req.user!;
    const { id: userId, role: userRole } = user;
    const result = await announcementsService.deleteAnnouncement(params.id, userId, userRole);
    res.status(200).json(result);
  }
}

export const announcementsController = new AnnouncementsController();
