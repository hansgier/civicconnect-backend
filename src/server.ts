import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { initSocket } from './socket/index.js';
import { boss } from './config/pg-boss.js';
import { startEmailWorkers } from './jobs/workers/email.worker.js';
import { startCleanupWorkers } from './jobs/workers/cleanup.worker.js';
import { scheduleCleanupJobs } from './jobs/queues/cleanup.queue.js';

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Initialize pg-boss
boss.on('error', (error) => console.error('pg-boss error:', error));
await boss.start();

// Ensure queues exist
const queues = [
  'verification-email',
  'password-reset-email',
  'cleanup-orphaned-media',
];
await Promise.all(queues.map((q) => boss.createQueue(q)));

await startEmailWorkers();
await startCleanupWorkers();
await scheduleCleanupJobs();

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed');
    await boss.stop();
    console.log('Background jobs stopped');
    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
