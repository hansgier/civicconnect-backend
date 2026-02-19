import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hashPassword } from '../src/shared/utils/hash.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.notification.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.media.deleteMany();
  await prisma.projectUpdate.deleteMany();
  await prisma.projectBarangay.deleteMany();
  await prisma.project.deleteMany();
  await prisma.fundingSource.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.barangay.deleteMany();

  // 2. Seed 110 barangays
  const barangayNames = [
    'Barangay 1 (Pob.)', 'Barangay 2 (Pob.)', 'Barangay 3 (Pob.)', 'Barangay 4 (Pob.)', 'Barangay 5 (Pob.)',
    'Barangay 6 (Pob.)', 'Barangay 7 (Pob.)', 'Barangay 8 (Pob.)', 'Barangay 9 (Pob.)', 'Barangay 10 (Pob.)',
    'Barangay 11 (Pob.)', 'Barangay 12 (Pob.)', 'Barangay 13 (Pob.)', 'Barangay 14 (Pob.)', 'Barangay 15 (Pob.)',
    'Barangay 16 (Pob.)', 'Barangay 17 (Pob.)', 'Barangay 18 (Pob.)', 'Barangay 19 (Pob.)', 'Barangay 20 (Pob.)',
    'Barangay 21 (Pob.)', 'Barangay 22 (Pob.)', 'Barangay 23 (Pob.)', 'Barangay 24 (Pob.)', 'Barangay 25 (Pob.)',
    'Barangay 26 (Pob.)', 'Barangay 27 (Pob.)', 'Barangay 28 (Pob.)', 'Barangay 29 (Pob.)',
    'Alto Amacan', 'Bagong', 'Batuan', 'Biliboy', 'Cabaon-an', 'Cabintan', 'Cagbuhangin', 'Cambahanon',
    'Camp Downes', 'Can-adieng', 'Can-untog', 'Catmon', 'Cogon', 'Danhug', 'Dayhagan', 'Dolores',
    'Don Felipe Larrazabal', 'Donghol', 'Esperanza', 'Guintigui-an', 'Hibunawon', 'Hugpa', 'Ipil', 'Lao',
    'Libertad', 'Liloan', 'Linao', 'Lourdes', 'Macabug', 'Magaswi', 'Mahayag', 'Mahayahay', 'Manlilinao',
    'Margen', 'Mas-in', 'Naungan', 'Nueva Sociedad', 'Nueva Vista', 'Patag', 'Punta', 'Rizal',
    'Rufina M. Tan', 'Sabang Bao', 'San Antonio', 'San Isidro', 'San Jose', 'San Pablo', 'San Vicente',
    'Santo Niño', 'Sumangga', 'Tongonan', 'Valencia', 'Airport', 'Alegria', 'Alta Vista', 'Bagongbong',
    'Bagong Buhay', 'Banat-e', 'Bantigue', 'Bayog', 'Boroc', 'Cabulihan', 'Concepcion', 'Curva', 'Domonar',
    'Don Carlos B. Rivilla Sr.', 'Don Potenciano Larrazabal', 'Doña Feliza Z. Mejia', 'Gaas', 'Green Valley',
    'Juaton', 'Kadaohan', 'Labrador', 'Lake Danao', 'Leondoni', 'Liberty', 'Licuma', 'Luna', 'Mabato',
    'Mabini', 'Matica-a', 'Milagro', 'Monterico', 'Nasunogan', 'Nazareno', 'Nueva Esperanza', 'Panilahan',
    'Quezon, Jr.', 'Salvacion', 'San Juan', 'Santa Cruz', 'Tambulilid'
  ];

  await prisma.barangay.createMany({
    data: barangayNames.map((name, i) => ({ name, district: i < 29 ? 'District 1' : 'District 2' })),
    skipDuplicates: true,
  });

  const allBarangays = await prisma.barangay.findMany();
  const getBrgyId = (name: string) => allBarangays.find(b => b.name === name)?.id;

  // 3. Seed Users
  const systemAdminPassword = await hashPassword('Admin123!');
  const barangayPassword = await hashPassword('Barangay123!');
  const citizenPassword = await hashPassword('Citizen123!');
  const assistantPassword = await hashPassword('Assistant123!');

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@ormocpis.com',
        password: systemAdminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Barangay Captain',
        email: 'barangay@ormocpis.com',
        password: barangayPassword,
        role: 'BARANGAY',
        status: 'ACTIVE',
        emailVerified: true,
        barangayId: getBrgyId('Barangay 1 (Pob.)'),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Juan Dela Cruz',
        email: 'citizen@ormocpis.com',
        password: citizenPassword,
        role: 'CITIZEN',
        status: 'ACTIVE',
        emailVerified: true,
        barangayId: getBrgyId('Barangay 1 (Pob.)'),
      },
    }),
    prisma.user.create({
      data: {
        name: 'City Assistant',
        email: 'assistant@ormocpis.com',
        password: assistantPassword,
        role: 'ASSISTANT_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    }),
  ]);

  const admin = users[0];
  const citizen = users[2];

  // 4. Seed Funding Sources
  const fundingSources = await Promise.all([
    prisma.fundingSource.create({ data: { name: 'General Fund' } }),
    prisma.fundingSource.create({ data: { name: 'Special Education Fund' } }),
    prisma.fundingSource.create({ data: { name: 'DPWH' } }),
    prisma.fundingSource.create({ data: { name: "Congressman's Fund" } }),
    prisma.fundingSource.create({ data: { name: 'Barangay Fund' } }),
  ]);

  // 5. Seed 6 Sample Projects
  const projectData = [
    { title: 'Poblacion Drainage Repair', status: 'COMPLETED', brgy: 'Barangay 1 (Pob.)', fund: 0, category: 'INFRASTRUCTURE' },
    { title: 'Valencia Multi-Purpose Hall', status: 'ONGOING', brgy: 'Valencia', fund: 4, category: 'SOCIAL' },
    { title: 'Cogon Elementary School Building', status: 'ONGOING', brgy: 'Cogon', fund: 1, category: 'EDUCATION' },
    { title: 'Ipil Health Center Renovation', status: 'PLANNED', brgy: 'Ipil', fund: 0, category: 'HEALTH' },
    { title: 'Tongonan Water System Expansion', status: 'PLANNED', brgy: 'Tongonan', fund: 2, category: 'WATER' },
    { title: 'Milagro Road Concreting', status: 'COMPLETED', brgy: 'Milagro', fund: 3, category: 'TRANSPORTATION' },
  ];

  const projects = await Promise.all(projectData.map(p =>
    prisma.project.create({
      data: {
        title: p.title,
        status: p.status as any,
        category: p.category as any,
        cost: 1000000 + Math.random() * 5000000,
        createdById: admin.id,
        fundingSourceId: fundingSources[p.fund].id,
        barangays: { create: [{ barangayId: getBrgyId(p.brgy)! }] }
      }
    })
  ));

  // 6. Seed Project Updates
  for (const project of projects.filter(p => p.status !== 'PLANNED')) {
    await prisma.projectUpdate.createMany({
      data: [
        { title: 'Project Mobilization', description: 'Equipment and materials delivered to site.', projectId: project.id, date: new Date('2024-10-01') },
        { title: 'Phase 1 Completion', description: 'Initial structural work completed.', projectId: project.id, date: new Date('2024-12-15') }
      ]
    });
  }

  // 7. Seed 5 Comments
  await prisma.comment.createMany({
    data: projects.slice(0, 5).map(p => ({
      content: `Excited for this project: ${p.title}!`,
      userId: citizen.id,
      projectId: p.id
    }))
  });

  // 8. Seed 2 Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'City-wide Infrastructure Update',
        content: 'The city is planning 10 new road projects this year.',
        excerpt: '10 new road projects planned.',
        category: 'INFRASTRUCTURE',
        authorId: admin.id
      },
      {
        title: 'Emergency Road Closure',
        content: 'Real St. will be closed for drainage repair this weekend.',
        excerpt: 'Real St. closed this weekend.',
        category: 'SAFETY',
        isUrgent: true,
        authorId: admin.id
      }
    ]
  });

  // 9. Seed 4 Contacts
  await prisma.contact.create({
    data: {
      title: 'Emergency Hotline',
      description: 'City emergency response center',
      phoneNumbers: ['911', '(053) 255-1234'],
      primaryPhone: '911',
      emails: ['emergency@ormoc.gov.ph'],
      schedule: '24/7',
      location: 'City Hall, Ormoc City',
      type: 'EMERGENCY',
      isEmergency: true,
      order: 1,
      createdById: admin.id,
    },
  });

  await prisma.contact.createMany({
    data: [
      { title: 'Engr. Maria Santos', description: 'Lead Engineer', phoneNumbers: ['0917-111-2222'], type: 'GOVERNMENT', createdById: admin.id },
      { title: 'Atty. Jose Rizal', description: 'City Legal Officer', phoneNumbers: ['0917-333-4444'], type: 'GOVERNMENT', createdById: admin.id },
      { title: 'Dr. Linda Gomez', description: 'Health Officer', phoneNumbers: ['0917-555-6666'], type: 'HEALTH', createdById: admin.id },
    ]
  });

  // 10. Seed Sample Notifications
  await prisma.notification.create({
    data: {
      title: 'Welcome to Ormoc PIS',
      description: 'Thank you for registering. You can now track infrastructure projects in your barangay.',
      type: 'SYSTEM',
      userId: citizen.id,
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
