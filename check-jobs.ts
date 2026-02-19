import { prisma } from './src/config/database.js';

async function main() {
  try {
    const columns = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'pgboss' AND table_name = 'job'`);
    console.log('Columns in pgboss.job:', columns);

    const jobs = await prisma.$queryRawUnsafe(`SELECT * FROM pgboss.job LIMIT 10`);
    console.log('Recent jobs in pg-boss:');
    console.log(JSON.stringify(jobs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
  } catch (error) {
    console.error('Error querying pg-boss jobs:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
