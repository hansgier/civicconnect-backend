import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { BadRequestError } from '../../shared/errors/errors.js';
import { userQuerySchema, type UpdateUserInput } from './users.schema.js';

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersListResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    barangayId: string | null;
    createdAt: Date;
    updatedAt: Date;
    barangay?: { id: string; name: string } | null;
  }>;
  pagination: PaginationResponse;
}

interface UserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    barangayId: string | null;
    createdAt: Date;
    updatedAt: Date;
    barangay?: { id: string; name: string } | null;
  };
}

interface MessageResponse {
  message: string;
}

export const usersController = {
  async getAll(req: Request, res: Response) {
    const query = userQuerySchema.parse(req.query);
    const result = await usersService.getAllUsers(query);
    res.status(200).json(result as UsersListResponse);
  },

  async getById(req: Request, res: Response) {
    const user = await usersService.getUserById(req.params.id as string);
    res.status(200).json({ user } as UserResponse);
  },

  async update(req: Request, res: Response) {
    const data = req.body as UpdateUserInput;
    const requestingUser = req.user as any;
    const user = await usersService.updateUser(req.params.id as string, data, requestingUser);
    res.status(200).json({ user } as UserResponse);
  },

  async remove(req: Request, res: Response) {
    const result = await usersService.deleteUser(req.params.id as string);
    res.status(200).json(result as MessageResponse);
  },

  async uploadAvatar(req: Request, res: Response) {
    const { id } = req.params;
    const file = req.file;
    if (!file) throw new BadRequestError('No file provided');
    const result = await usersService.uploadAvatar(id as string, (req.user as { id: string }).id, file);
    res.status(200).json(result);
  },

  async getLikedProjects(req: Request, res: Response) {
    const id = req.params.id as string;
    const page = String(req.query.page || '1');
    const limit = String(req.query.limit || '10');
    const projects = await usersService.getLikedProjects(id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
    res.json({ success: true, data: projects });
  },

  async getUserComments(req: Request, res: Response) {
    const id = req.params.id as string;
    const page = String(req.query.page || '1');
    const limit = String(req.query.limit || '10');
    const comments = await usersService.getUserComments(id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
    res.json({ success: true, data: comments });
  },

  async getUserActivity(req: Request, res: Response) {
    const id = req.params.id as string;
    const limit = String(req.query.limit || '20');
    const activity = await usersService.getUserActivity(id, Number(limit) || 20);
    res.json({ success: true, data: activity });
  },

  async getUserStats(req: Request, res: Response) {
    const id = req.params.id as string;
    const stats = await usersService.getUserStats(id);
    res.json({ success: true, data: stats });
  },
};
