import { Request, Response } from 'express';
import { projectsService } from './projects.service.js';
import type {
  ProjectQueryInput,
  ProjectParamsInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './projects.schema.js';

export class ProjectsController {
  async getAll(req: Request, res: Response) {
    const query = req.query as unknown as ProjectQueryInput;
    const result = await projectsService.getAllProjects(query);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response) {
    const params = req.params as unknown as ProjectParamsInput;
    const project = await projectsService.getProjectById(params.id);
    res.status(200).json({ project });
  }

  async create(req: Request, res: Response) {
    const data = req.body as CreateProjectInput;
    const user = req.user as { id: string };
    const userId = user.id;
    const project = await projectsService.createProject(data, userId);
    res.status(201).json({ project });
  }

  async update(req: Request, res: Response) {
    const params = req.params as unknown as ProjectParamsInput;
    const data = req.body as UpdateProjectInput;
    const requestingUser = req.user as any;
    const project = await projectsService.updateProject(params.id, data, requestingUser);
    res.status(200).json({ project });
  }

  async remove(req: Request, res: Response) {
    const params = req.params as unknown as ProjectParamsInput;
    const result = await projectsService.deleteProject(params.id, req.user as any);
    res.status(200).json(result);
  }

  async removeAll(req: Request, res: Response) {
    const requestingUser = req.user as any;
    const result = await projectsService.deleteAllProjects(requestingUser);
    res.status(200).json(result);
  }
}

export const projectsController = new ProjectsController();
