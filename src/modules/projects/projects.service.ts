import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/errors.js';
import { getCache, setCache, invalidateCache } from '../../shared/utils/cache.js';
import { sanitizeContent } from '../../shared/utils/sanitize-html.js';
import { CACHE_TTL } from '../../shared/constants/index.js';
import { createBulkNotifications } from '../notifications/notification.helper.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryInput,
} from './projects.schema.js';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned',
  APPROVED_PROPOSAL: 'Approved Proposal',
  ONGOING: 'Ongoing',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export class ProjectsService {
  async getAllProjects(query: ProjectQueryInput) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const cacheKey = `projects:page=${page}:limit=${limit}:status=${query.status || ''}:category=${query.category || ''}:barangayId=${query.barangayId || ''}:search=${query.search || ''}:fundingSourceId=${query.fundingSourceId || ''}:sortBy=${query.sortBy || 'createdAt'}:sortOrder=${query.sortOrder || 'desc'}`;

    const cached = getCache<{ projects: unknown; pagination: unknown }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.barangayId) {
      where.barangays = {
        some: {
          barangayId: query.barangayId,
        },
      };
    }

    if (query.search) {
      where.title = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.fundingSourceId) {
      where.fundingSourceId = query.fundingSourceId;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true, avatar: true },
          },
          barangays: {
            include: {
              barangay: {
                select: { id: true, name: true },
              },
            },
          },
          fundingSource: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, reactions: true, media: true },
          },
          media: {
            take: 1,
            where: { type: 'IMAGE' },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Enhance projects with reaction counts
    const projectIds = projects.map((p) => p.id);
    const reactions = await prisma.reaction.groupBy({
      by: ['projectId', 'type'],
      where: { projectId: { in: projectIds } },
      _count: true,
    });

    const projectsWithCounts = projects.map((project) => {
      const projectReactions = reactions.filter((r) => r.projectId === project.id);
      const approveCount = projectReactions.find((r) => r.type === 'LIKE')?._count ?? 0;
      const disapproveCount = projectReactions.find((r) => r.type === 'DISLIKE')?._count ?? 0;

      return {
        ...project,
        approveCount,
        disapproveCount,
      };
    });

    const result = {
      projects: projectsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    setCache(cacheKey, result, CACHE_TTL.PROJECTS);

    return result;
  }

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        barangays: {
          include: {
            barangay: {
              select: { id: true, name: true, district: true },
            },
          },
        },
        fundingSource: {
          select: { id: true, name: true },
        },
        comments: {
          where: { parentId: null },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
                _count: { select: { reactions: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
            _count: { select: { reactions: true, replies: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        media: {
          select: { id: true, url: true, type: true, publicId: true },
          orderBy: { createdAt: 'desc' },
        },
        updates: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const reactionCounts = await prisma.reaction.groupBy({
      by: ['type'],
      where: { projectId: id },
      _count: true,
    });

    const approveCount = reactionCounts.find((r) => r.type === 'LIKE')?._count ?? 0;
    const disapproveCount = reactionCounts.find((r) => r.type === 'DISLIKE')?._count ?? 0;

    return {
      ...project,
      approveCount,
      disapproveCount,
    };
  }

  async createProject(data: CreateProjectInput, userId: string) {
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description ? sanitizeContent(data.description) : data.description,
        cost: data.cost,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status ?? 'PLANNED',
        category: data.category,
        implementingAgency: data.implementingAgency,
        contractor: data.contractor,
        fundingSourceId: data.fundingSourceId,
        createdById: userId,
      },
    });

    for (const barangayId of data.barangayIds) {
      await prisma.projectBarangay.create({
        data: {
          projectId: project.id,
          barangayId,
        },
      });
    }

    const projectWithRelations = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        barangays: {
          include: {
            barangay: {
              select: { id: true, name: true },
            },
          },
        },
        fundingSource: {
          select: { id: true, name: true },
        },
      },
    });

    invalidateCache('projects:*');
    invalidateCache('dashboard:*');

    // Notify active barangay residents about the new project
    if (data.barangayIds.length > 0) {
      const barangayResidents = await prisma.user.findMany({
        where: {
          barangayId: { in: data.barangayIds },
          status: 'ACTIVE',
          email: { not: 'guest@opts.local' },
          id: { not: userId },
        },
        select: { id: true },
      });

      if (barangayResidents.length > 0 && projectWithRelations) {
        await createBulkNotifications(
          barangayResidents.map((user) => ({
            title: `New project in your barangay: "${projectWithRelations.title}"`,
            description: data.description?.substring(0, 100) ?? 'A new project has been created.',
            type: 'SYSTEM' as const,
            userId: user.id,
            projectId: projectWithRelations.id,
          }))
        );
      }
    }

    return projectWithRelations;
  }

  async updateProject(id: string, data: UpdateProjectInput, requestingUser: { id: string; role: string; barangayId: string | null }) {
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        barangays: {
          select: { barangayId: true },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    if (requestingUser.role !== 'ADMIN') {
      const userBarangayIds = existingProject.barangays.map(b => b.barangayId);
      if (!userBarangayIds.includes(requestingUser.barangayId!)) {
        throw new ForbiddenError('You can only manage projects in your barangay');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) {
      updateData.description = data.description ? sanitizeContent(data.description) : data.description;
    }
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.implementingAgency !== undefined) updateData.implementingAgency = data.implementingAgency;
    if (data.contractor !== undefined) updateData.contractor = data.contractor;
    if (data.fundingSourceId !== undefined) updateData.fundingSource = data.fundingSourceId ? { connect: { id: data.fundingSourceId } } : undefined;
    if (data.completionDate !== undefined) updateData.completionDate = new Date(data.completionDate);

    if (data.status === 'COMPLETED' && existingProject.status !== 'COMPLETED') {
      updateData.completionDate = new Date();
    }

    if (data.barangayIds !== undefined) {
      await prisma.projectBarangay.deleteMany({
        where: { projectId: id },
      });
      for (const barangayId of data.barangayIds) {
        await prisma.projectBarangay.create({
          data: {
            projectId: id,
            barangayId,
          },
        });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        barangays: {
          include: {
            barangay: {
              select: { id: true, name: true },
            },
          },
        },
        fundingSource: {
          select: { id: true, name: true },
        },
      },
    });

    // Notify followers when status changes
    if (data.status && data.status !== existingProject.status) {
      const [reactors, commenters] = await Promise.all([
        prisma.reaction.findMany({
          where: { projectId: id },
          select: { userId: true },
          distinct: ['userId'],
        }),
        prisma.comment.findMany({
          where: { projectId: id },
          select: { userId: true },
          distinct: ['userId'],
        }),
      ]);

      const followerIds = new Set<string>();
      for (const r of reactors) followerIds.add(r.userId);
      for (const c of commenters) followerIds.add(c.userId);
      followerIds.delete(requestingUser.id);

      if (followerIds.size > 0) {
        const statusLabel = STATUS_LABELS[data.status] ?? data.status;
        await createBulkNotifications(
          Array.from(followerIds).map((userId) => ({
            title: `Project status update: "${project.title}"`,
            description: `Status changed to ${statusLabel}.`,
            type: 'UPDATE' as const,
            userId,
            projectId: id,
          }))
        );
      }
    }

    invalidateCache('projects:*');
    invalidateCache('dashboard:*');

    return project;
  }

  async deleteProject(id: string, requestingUser: { id: string; role: string; barangayId: string | null }) {
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        barangays: {
          select: { barangayId: true },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    if (requestingUser.role !== 'ADMIN') {
      const userBarangayIds = existingProject.barangays.map(b => b.barangayId);
      if (!userBarangayIds.includes(requestingUser.barangayId!)) {
        throw new ForbiddenError('You can only manage projects in your barangay');
      }
    }

    await prisma.project.delete({
      where: { id },
    });

    invalidateCache('projects:*');
    invalidateCache('dashboard:*');

    return { success: true, message: 'Project deleted successfully' };
  }

  async deleteAllProjects(requestingUser: { id: string; role: string }) {
    if (requestingUser.role === 'ADMIN') {
      await prisma.project.deleteMany({});
    } else {
      // BARANGAY role — only delete projects created by this user
      await prisma.project.deleteMany({
        where: { createdById: requestingUser.id },
      });
    }

    invalidateCache('projects:*');
    invalidateCache('dashboard:*');

    return { success: true, message: 'Projects deleted successfully' };
  }
}

export const projectsService = new ProjectsService();
