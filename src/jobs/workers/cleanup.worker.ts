import { boss } from '../../config/pg-boss.js';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { deleteMultipleFromCloudinary } from '../../modules/media/media.service.js';

export async function startCleanupWorkers() {
  await boss.work('cleanup-orphaned-media', async () => {
    // Find media records not linked to any project
    const orphaned = await prisma.media.findMany({
      where: { projectId: null }
    });

    if (orphaned.length === 0) {
      logger.info('No orphaned media found for cleanup');
      return;
    }

    const publicIds = orphaned.map((m) => m.publicId);
    const ids = orphaned.map((m) => m.id);

    // Delete from Cloudinary
    try {
      await deleteMultipleFromCloudinary(publicIds);
      
      // Delete from DB
      const result = await prisma.media.deleteMany({
        where: { id: { in: ids } }
      });
      
      logger.info(`Cleaned up ${result.count} orphaned media records from Cloudinary and DB`);
    } catch (error) {
      logger.error({ err: error }, 'Failed to cleanup orphaned media');
      throw error; // Rethrow for pg-boss retry
    }
  });
}
