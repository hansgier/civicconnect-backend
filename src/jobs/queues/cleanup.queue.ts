import { boss } from '../../config/pg-boss.js';

export async function scheduleCleanupJobs() {
  // Cleanup orphaned Cloudinary media — runs weekly (2 AM every Sunday)
  await boss.schedule('cleanup-orphaned-media', '0 2 * * 0', {}, {});
}
