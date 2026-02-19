import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../shared/errors/errors.js';
import type {
  CreateBarangayInput,
  UpdateBarangayInput,
  BarangayQueryInput,
} from './barangays.schema.js';

export class BarangaysService {
  async getAllBarangays(query: BarangayQueryInput) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.district) {
      where.district = query.district;
    }

    const [barangays, total] = await Promise.all([
      prisma.barangay.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { users: true, projects: true },
          },
        },
      }),
      prisma.barangay.count({ where }),
    ]);

    return {
      barangays,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBarangayById(id: string) {
    const barangay = await prisma.barangay.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    });

    if (!barangay) {
      throw new NotFoundError('Barangay not found');
    }

    return barangay;
  }

  async createBarangay(data: CreateBarangayInput) {
    const barangay = await prisma.barangay.create({
      data: {
        name: data.name,
        district: data.district,
        population: data.population,
      },
    });

    return barangay;
  }

  async updateBarangay(id: string, data: UpdateBarangayInput) {
    await this.getBarangayById(id);

    const barangay = await prisma.barangay.update({
      where: { id },
      data: {
        name: data.name,
        district: data.district,
        population: data.population,
      },
    });

    return barangay;
  }

  async deleteBarangay(id: string) {
    const barangay = await prisma.barangay.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    });

    if (!barangay) {
      throw new NotFoundError('Barangay not found');
    }

    if (barangay._count.users > 0 || barangay._count.projects > 0) {
      throw new Error('Cannot delete barangay with associated users or projects');
    }

    await prisma.barangay.delete({ where: { id } });

    return { success: true, message: 'Barangay deleted successfully' };
  }
}

export const barangaysService = new BarangaysService();
