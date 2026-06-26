const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const institutions = [
  { name: 'Bennett University', emailSuffix: '@bennett.edu.in' },
  { name: 'Lovely Professional University', emailSuffix: '@lpu.edu.in' },
  { name: 'Manipal University', emailSuffix: '@manipal.edu' },
  { name: 'VIT University', emailSuffix: '@vit.ac.in' },
  { name: 'SRM University', emailSuffix: '@srmist.edu.in' },
  { name: 'Amity University', emailSuffix: '@amity.edu' },
  { name: 'Sharda University', emailSuffix: '@sharda.ac.in' },
  { name: 'Symbiosis International University', emailSuffix: '@symbiosis.ac.in' },
  { name: 'Chitkara University', emailSuffix: '@chitkara.edu.in' },
  { name: 'Chandigarh University', emailSuffix: '@cumail.in' },
  { name: 'Thapar Institute of Engineering & Technology', emailSuffix: '@thapar.edu' },
  { name: 'BITS Pilani', emailSuffix: '@pilani.bits-pilani.ac.in' },
  { name: 'Delhi Technological University', emailSuffix: '@dtu.ac.in' },
  { name: 'Jamia Millia Islamia', emailSuffix: '@jmi.ac.in' },
  { name: 'NMIMS University', emailSuffix: '@nmims.edu' },
  { name: 'Presidency University', emailSuffix: '@presidencyuniversity.in' },
  { name: 'Christ University', emailSuffix: '@christuniversity.in' },
  { name: 'Parul University', emailSuffix: '@paruluniversity.ac.in' },
  { name: 'Graphic Era University', emailSuffix: '@geu.ac.in' },
  { name: 'Kalinga Institute of Industrial Technology', emailSuffix: '@kiit.ac.in' },
];

async function main() {
  console.log('Seeding institutions...');

  for (const inst of institutions) {
    await prisma.institution.upsert({
      where: { emailSuffix: inst.emailSuffix },
      update: { name: inst.name },
      create: inst,
    });
  }

  console.log(`Seeded ${institutions.length} institutions.`);

  // Create a SuperAdmin account
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@campusvote.in';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  await prisma.admin.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash,
      isSuperAdmin: true,
    },
  });

  console.log(`SuperAdmin created: ${superAdminEmail} (password: ${superAdminPassword})`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
