import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../shared/errors/errors.js';
import type { CreateFundingSourceInput, UpdateFundingSourceInput } from './funding-sources.schema.js';

export const fundingSourcesService = {
  async getAllFundingSources() {
    return prisma.fundingSource.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  },

  async getFundingSourceById(id: string) {
    const fundingSource = await prisma.fundingSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!fundingSource) {
      throw new NotFoundError('Funding source not found');
    }

    return fundingSource;
  },

  async createFundingSource(data: CreateFundingSourceInput) {
    return prisma.fundingSource.create({
      data,
    });
  },

  async updateFundingSource(id: string, data: UpdateFundingSourceInput) {
    const existing = await prisma.fundingSource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Funding source not found');
    }

    return prisma.fundingSource.update({
      where: { id },
      data,
    });
  },

  async deleteFundingSource(id: string) {
    const fundingSource = await prisma.fundingSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!fundingSource) {
      throw new NotFoundError('Funding source not found');
    }

    if (fundingSource._count.projects > 0) {
      throw new ConflictError(`Cannot delete: funding source is in use by ${fundingSource._count.projects} projects`);
    }

    await prisma.fundingSource.delete({
      where: { id },
    });

    return { success: true };
  },
};
