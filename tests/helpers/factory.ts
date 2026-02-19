import { prisma } from '../../src/config/database';
import { ProjectStatus, ReactionType, MediaType } from '@prisma/client';

export const createBarangay = async (overrides: any = {}) => {
  return prisma.barangay.create({
    data: {
      name: `Barangay ${Math.random()}`,
      district: 'District 1',
      population: 1000,
      ...overrides,
    },
  });
};

export const createProject = async (overrides: any = {}) => {
  // Ensure we have a creator
  if (!overrides.createdById) {
    const user = await prisma.user.findFirst();
    if (user) {
      overrides.createdById = user.id;
    } else {
      throw new Error('No user found to create project. Create a user first.');
    }
  }

  return prisma.project.create({
    data: {
      title: `Project ${Math.random()}`,
      description: 'Test project description',
      status: ProjectStatus.PLANNED,
      ...overrides,
    },
  });
};

export const createComment = async (overrides: any = {}) => {
  if (!overrides.userId || !overrides.projectId) {
    throw new Error('userId and projectId are required for createComment');
  }

  return prisma.comment.create({
    data: {
      content: 'Test comment content',
      ...overrides,
    },
  });
};

export const createProjectUpdate = async (overrides: any = {}) => {
  if (!overrides.projectId) {
    throw new Error('projectId is required for createProjectUpdate');
  }

  return prisma.projectUpdate.create({
    data: {
      title: 'Test Update',
      description: 'Test update description',
      ...overrides,
    },
  });
};

export const createFundingSource = async (overrides: any = {}) => {
  return prisma.fundingSource.create({
    data: {
      name: `Funding Source ${Math.random()}`,
      ...overrides,
    },
  });
};

export const createAnnouncement = async (overrides: any = {}) => {
  if (!overrides.authorId) {
    throw new Error('authorId is required for createAnnouncement');
  }

  return prisma.announcement.create({
    data: {
      title: 'Test Announcement',
      content: 'Test announcement content',
      ...overrides,
    },
  });
};
