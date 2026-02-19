import { prisma } from './src/config/database.js';

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE pgboss.job 
    SET state = 'created', retry_count = 0, completed_on = null, started_on = null, output = null
    WHERE state = 'failed' AND name = 'verification-email'
  `);
  console.log(`Updated ${result} jobs to retry`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
