import { execSync } from 'child_process';
import { prisma } from '../src/config/database';
import { boss } from '../src/config/pg-boss';
import { clearCache } from '../src/shared/utils/cache';
import { vi } from 'vitest';

// Mock pg-boss to avoid queue issues in tests
vi.mock('../src/config/pg-boss', () => ({
  boss: {
    start: vi.fn().mockResolvedValue({}),
    stop: vi.fn().mockResolvedValue({}),
    send: vi.fn().mockResolvedValue('job-id'),
    on: vi.fn(),
  },
}));

let isSchemaPushed = false;

beforeAll(async () => {
  // Set up test database URL (ensuring it's picked up from .env.test)
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set in .env.test');
  }

  // Run Prisma migrations on the test database (only once per run)
  if (!isSchemaPushed) {
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      isSchemaPushed = true;
    } catch (error) {
      console.error('Failed to push schema to test database:', error);
      throw error;
    }
  }

  // Global setup: initialize Prisma client
  await prisma.$connect();

  // Global setup: start pg-boss
  await boss.start();
});

beforeEach(() => {
  clearCache();
});

afterAll(async () => {
  // Global teardown: disconnect Prisma
  await prisma.$disconnect();

  // Global teardown: stop pg-boss
  await boss.stop();
});
