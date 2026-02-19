import { Request, Response } from 'express';
import { updatesService } from './updates.service.js';
import type {
  UpdateParamsInput,
  UpdateProjectParamsInput,
  CreateUpdateInput,
  UpdateUpdateInput,
  UpdateQueryInput,
} from './updates.schema.js';

export class UpdatesController {
  async getAll(req: Request, res: Response) {
    const params = req.params as unknown as UpdateProjectParamsInput;
    const query = req.query as unknown as UpdateQueryInput;
    const result = await updatesService.getAllUpdates(params.projectId, query);
    res.status(200).json(result);
  }

  async create(req: Request, res: Response) {
    const params = req.params as unknown as UpdateProjectParamsInput;
    const data = req.body as CreateUpdateInput;
    const requestingUser = req.user as { id: string; role: string };
    const update = await updatesService.createUpdate(params.projectId, data, requestingUser);
    res.status(201).json({ update });
  }

  async update(req: Request, res: Response) {
    const params = req.params as unknown as UpdateParamsInput;
    const data = req.body as UpdateUpdateInput;
    const requestingUser = req.user as { id: string; role: string };
    const update = await updatesService.updateUpdate(params.projectId, params.id, data, requestingUser);
    res.status(200).json({ update });
  }

  async remove(req: Request, res: Response) {
    const params = req.params as unknown as UpdateParamsInput;
    const requestingUser = req.user as { id: string; role: string };
    const result = await updatesService.deleteUpdate(params.projectId, params.id, requestingUser);
    res.status(200).json(result);
  }

  async removeAll(req: Request, res: Response) {
    const params = req.params as unknown as UpdateProjectParamsInput;
    const requestingUser = req.user as { id: string; role: string };
    const result = await updatesService.deleteAllUpdates(params.projectId, requestingUser);
    res.status(200).json(result);
  }
}

export const updatesController = new UpdatesController();
