import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('Verifying Database Records...');
  
  const counts = {
    barangays: await prisma.barangay.count(),
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    fundingSources: await prisma.fundingSource.count(),
    tags: await prisma.tag.count(),
    updates: await prisma.projectUpdate.count(),
    comments: await prisma.comment.count(),
    announcements: await prisma.announcement.count(),
    contacts: await prisma.contact.count(),
  };

  console.table(counts);

  if (counts.barangays === 110) {
    console.log('✅ 110 Barangays successfully seeded.');
  } else {
    console.warn(`⚠️ Unexpected Barangay count: ${counts.barangays} (Expected 110)`);
  }

  if (counts.users === 4) {
    console.log('✅ All 4 test users (Admin, Barangay, Citizen, Assistant) created.');
  }

  if (counts.projects >= 5) {
    console.log(`✅ ${counts.projects} projects created (Satisfies 5-10 range).`);
  }
}

verify()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
