import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors/errors.js';
import { uploadToCloudinary } from '../media/media.service.js';
import type { UpdateUserInput, UserQuery } from './users.schema.js';
import { createAndEmitNotification } from '../notifications/notification.helper.js';
import type { UserRole, UserStatus } from '../../shared/constants/index.js';
import { parsePagination } from '../../shared/utils/pagination.js';

interface RequestUser {
  id: string;
  role: UserRole;
  barangayId: string | null;
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    barangayId: string | null;
    createdAt: Date;
    updatedAt: Date;
    barangay?: { id: string; name: string } | null;
    avatar?: string | null;
  }>;
  pagination: PaginationResult;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

const excludeSensitiveFields = (user: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, refreshToken: _refreshToken, verificationToken: _verificationToken, passwordResetToken: _passwordResetToken, ...safeUser } = user;
  return safeUser;
};

export const usersService = {
  async getAllUsers(query: UserQuery): Promise<UsersResponse> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.barangayId) {
      where.barangayId = query.barangayId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          barangay: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map(user => excludeSensitiveFields(user)) as any,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        barangay: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return excludeSensitiveFields(user);
  },

  async updateUser(id: string, data: UpdateUserInput, requestingUser: RequestUser) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    const isOwner = requestingUser.id === id;
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const updateData: Record<string, unknown> = {};

    if (isOwner) {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.barangayId !== undefined) updateData.barangayId = data.barangayId;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;

      if (data.email && data.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailExists) {
          throw new ConflictError('Email already in use');
        }
      }
    } else if (isAdmin) {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.barangayId !== undefined) updateData.barangayId = data.barangayId;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;

      if (data.email && data.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailExists) {
          throw new ConflictError('Email already in use');
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Notify user when admin changes their role or status
      if (isAdmin && !isOwner) {
        const roleChanged = data.role && data.role !== existingUser.role;
        const statusChanged = data.status && data.status !== existingUser.status;

        if (roleChanged) {
          await createAndEmitNotification({
            title: 'Your role has been updated',
            description: `Your role has been changed to ${data.role}.`,
            type: 'SYSTEM',
            userId: id,
          });
        }

        if (statusChanged) {
          await createAndEmitNotification({
            title: 'Your account status has changed',
            description: `Your account status has been changed to ${data.status}.`,
            type: 'SYSTEM',
            userId: id,
          });
        }
      }
    }

    return this.getUserById(id);
  },

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  },

  async uploadAvatar(userId: string, requesterId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isOwner = requesterId === userId;
    const isAdmin = (await prisma.user.findUnique({ where: { id: requesterId } }))?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only update your own avatar');
    }

    const result = await uploadToCloudinary(file.buffer, {
      folder: 'opts/avatars',
      public_id: userId,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: result.url },
    });

    return { avatar: result.url };
  },

  async getLikedProjects(userId: string, pagination?: PaginationOptions) {
    const paginationData = parsePagination(pagination);
    const reactions = await prisma.reaction.findMany({
      where: {
        userId,
        type: 'LIKE',
        projectId: { not: null },
      },
      include: {
        project: {
          include: {
            media: { take: 1 },
            barangays: { include: { barangay: true } },
            _count: { select: { comments: true, reactions: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: paginationData.skip,
      take: paginationData.take,
    });

    // Extract projects and add reaction counts
    const projects = await Promise.all(
      reactions
        .filter((r) => r.project !== null)
        .map(async (r) => {
          const [approveCount, disapproveCount] = await Promise.all([
            prisma.reaction.count({
              where: { projectId: r.projectId!, type: 'LIKE' },
            }),
            prisma.reaction.count({
              where: { projectId: r.projectId!, type: 'DISLIKE' },
            }),
          ]);
          return { ...r.project, approveCount, disapproveCount };
        })
    );

    return projects;
  },

  async getUserComments(userId: string, pagination?: PaginationOptions) {
    const paginationData = parsePagination(pagination);
    const comments = await prisma.comment.findMany({
      where: { userId },
      include: {
        project: { select: { id: true, title: true } },
        _count: { select: { reactions: true, replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: paginationData.skip,
      take: paginationData.take,
    });

    // Add like count per comment
    return Promise.all(
      comments.map(async (comment) => {
        const likes = await prisma.reaction.count({
          where: { commentId: comment.id, type: 'LIKE' },
        });
        return { ...comment, likes };
      })
    );
  },

  async getUserActivity(userId: string, limit: number = 20) {
    // Combine reactions and comments into a unified timeline
    const [reactions, comments] = await Promise.all([
      prisma.reaction.findMany({
        where: { userId, projectId: { not: null } },
        include: {
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.comment.findMany({
        where: { userId },
        include: {
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Merge and sort by date
    const activities = [
      ...reactions.map((r) => ({
        id: r.id,
        type: r.type === 'LIKE' ? 'approved' : 'disapproved',
        projectId: r.projectId,
        projectTitle: r.project?.title,
        createdAt: r.createdAt,
      })),
      ...comments.map((c) => ({
        id: c.id,
        type: 'commented' as const,
        projectId: c.projectId,
        projectTitle: c.project.title,
        content: c.content.substring(0, 100),
        createdAt: c.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return activities;
  },

  async getUserStats(userId: string) {
    const [projectsFollowed, totalApprovals, totalComments] = await Promise.all([
      // Projects followed = projects the user has LIKED (approved)
      prisma.reaction.count({
        where: { userId, type: 'LIKE', projectId: { not: null } },
      }),
      // Total approvals made by the user (both project and comment likes)
      prisma.reaction.count({
        where: { userId, type: 'LIKE' },
      }),
      // Total comments made by the user
      prisma.comment.count({
        where: { userId },
      }),
    ]);

    return {
      projectsFollowed,
      totalApprovals,
      totalComments,
    };
  },
};
