import { prisma } from '../../config/database.js';
import { cloudinary } from '../../config/cloudinary.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/errors.js';
import { invalidateCache } from '../../shared/utils/cache.js';

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

interface UploadResult {
  url: string;
  publicId: string;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  folderOrOptions: string | { folder: string; public_id?: string }
): Promise<UploadResult> => {
  const options =
    typeof folderOrOptions === 'string' ? { folder: folderOrOptions } : folderOrOptions;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        ...options,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const deleteMultipleFromCloudinary = async (publicIds: string[]): Promise<void> => {
  await cloudinary.api.delete_resources(publicIds);
};

const getMediaTypeFromMime = (mimeType: string): MediaType => {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  } else if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  } else {
    return 'DOCUMENT';
  }
};

export class MediaService {
  private async checkProjectOwnership(projectId: string, requestingUser: { id: string; role: string }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isAdmin = requestingUser.role === 'ADMIN';
    const isAssistantAdmin = requestingUser.role === 'ASSISTANT_ADMIN';
    const isCreator = project.createdById === requestingUser.id;

    if (!isAdmin && !isAssistantAdmin && !isCreator) {
      throw new ForbiddenError('Only the project creator or an authorized admin can manage media');
    }

    return project;
  }

  async uploadMedia(
    files: Express.Multer.File[],
    projectId: string,
    requestingUser: { id: string; role: string }
  ) {
    await this.checkProjectOwnership(projectId, requestingUser);

    const folder = `ormoc-pis/projects/${projectId}`;

    const mediaRecords = [];

    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer, folder);
      const mediaType = getMediaTypeFromMime(file.mimetype);

      const media = await prisma.media.create({
        data: {
          url: result.url,
          publicId: result.publicId,
          type: mediaType,
          projectId: projectId,
        },
      });

      mediaRecords.push(media);
    }

    invalidateCache(`projects:${projectId}:*`);

    return mediaRecords;
  }

  async getMediaByProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return await prisma.media.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMedia(id: string, requestingUser: { id: string; role: string }) {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundError('Media not found');
    }

    if (media.projectId) {
      await this.checkProjectOwnership(media.projectId, requestingUser);
    } else {
      // If media is not linked to a project, only admin can delete
      if (requestingUser.role !== 'ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }
    }

    try {
      await deleteFromCloudinary(media.publicId);
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      // Continue to delete from DB anyway to avoid stale entries
    }

    await prisma.media.delete({
      where: { id },
    });

    if (media.projectId) {
      invalidateCache('projects:*');
    }

    return { success: true, message: 'Media deleted successfully' };
  }

  async deleteAllMediaByProject(projectId: string, requestingUser: { id: string; role: string }) {
    await this.checkProjectOwnership(projectId, requestingUser);

    const media = await prisma.media.findMany({
      where: { projectId },
      select: { publicId: true },
    });

    const allPublicIds = media.map((m) => m.publicId);

    if (allPublicIds.length > 0) {
      await deleteMultipleFromCloudinary(allPublicIds);
    }

    await prisma.media.deleteMany({
      where: { projectId },
    });

    invalidateCache(`projects:${projectId}:*`);

    return { success: true, message: 'All media deleted successfully' };
  }
}

export const mediaService = new MediaService();

