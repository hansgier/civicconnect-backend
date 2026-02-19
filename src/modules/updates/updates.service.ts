import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/errors.js';
import { getCache, invalidateCache } from '../../shared/utils/cache.js';
import { sanitizeContent } from '../../shared/utils/sanitize-html.js';
import { createBulkNotifications } from '../notifications/notification.helper.js';
import type {
  CreateUpdateInput,
  UpdateUpdateInput,
  UpdateQueryInput,
} from './updates.schema.ts';

export class UpdatesService {
  private async checkProjectOwnership(projectId: string, requestingUser: { id: string; role: string }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isAdmin = requestingUser.role === 'ADMIN';
    const isCreator = project.createdById === requestingUser.id;

    if (!isAdmin && !isCreator) {
      throw new ForbiddenError('Only the project creator or admin can manage project updates');
    }

    return project;
  }

  async getAllUpdates(projectId: string, query: UpdateQueryInput = { sortBy: 'date', sortOrder: 'desc' }) {
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';

    const search = query.search;

    const cacheKey = `projects:${projectId}:updates:sort=${sortBy}:order=${sortOrder}:search=${search || ''}`;

    const cached = getCache<{ updates: unknown }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Record<string, unknown> = { projectId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const updates = await prisma.projectUpdate.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const result = { updates };
    invalidateCache(cacheKey);

    return result;
  }

  async createUpdate(projectId: string, data: CreateUpdateInput, requestingUser: { id: string; role: string }) {
    await this.checkProjectOwnership(projectId, requestingUser);

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        title: data.title,
        description: data.description ? sanitizeContent(data.description) : data.description,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    // Notify users who have reacted to or commented on the project
    const [reactors, commenters] = await Promise.all([
      prisma.reaction.findMany({
        where: { projectId: update.projectId },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.comment.findMany({
        where: { projectId: update.projectId },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const followerIds = new Set<string>();
    for (const r of reactors) followerIds.add(r.userId);
    for (const c of commenters) followerIds.add(c.userId);
    followerIds.delete(requestingUser.id);

    if (followerIds.size > 0) {
      await createBulkNotifications(
        Array.from(followerIds).map((userId) => ({
          title: `Project update: "${update.title}"`,
          description: update.description?.substring(0, 100) ?? 'A new update was posted.',
          type: 'UPDATE' as const,
          userId,
          projectId: update.projectId,
        }))
      );
    }

    invalidateCache(`projects:${projectId}:*`);

    return update;
  }

  async updateUpdate(projectId: string, id: string, data: UpdateUpdateInput, requestingUser: { id: string; role: string }) {
    await this.checkProjectOwnership(projectId, requestingUser);

    const existingUpdate = await prisma.projectUpdate.findUnique({
      where: { id },
    });

    if (!existingUpdate) {
      throw new NotFoundError('Update not found');
    }

    if (existingUpdate.projectId !== projectId) {
      throw new NotFoundError('Update does not belong to this project');
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) {
      updateData.description = data.description ? sanitizeContent(data.description) : data.description;
    }
    if (data.date !== undefined) updateData.date = new Date(data.date);

    const update = await prisma.projectUpdate.update({
      where: { id },
      data: updateData,
    });

    invalidateCache(`projects:${projectId}:*`);

    return update;
  }

  async deleteUpdate(projectId: string, id: string, requestingUser: { id: string; role: string }) {
    await this.checkProjectOwnership(projectId, requestingUser);

    const existingUpdate = await prisma.projectUpdate.findUnique({
      where: { id },
    });

    if (!existingUpdate) {
      throw new NotFoundError('Update not found');
    }

    if (existingUpdate.projectId !== projectId) {
      throw new NotFoundError('Update does not belong to this project');
    }

    await prisma.projectUpdate.delete({
      where: { id },
    });

    invalidateCache(`projects:${projectId}:*`);

    return { success: true, message: 'Update deleted successfully' };
  }

  async deleteAllUpdates(projectId: string, requestingUser: { id: string; role: string }) {
    await this.checkProjectOwnership(projectId, requestingUser);

    await prisma.projectUpdate.deleteMany({
      where: { projectId },
    });

    invalidateCache(`projects:${projectId}:*`);

    return { success: true, message: 'All updates deleted successfully' };
  }
}

export const updatesService = new UpdatesService();

