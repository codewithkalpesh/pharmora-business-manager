// seed_admin.js — run from server/ directory
const prisma = require('./src/config/prisma');
const bcrypt = require('bcrypt');

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  console.log('\n=== EXISTING USERS ===');
  if (users.length === 0) {
    console.log('  (none)');
  } else {
    users.forEach(u => console.log(`  ${u.role} | ${u.name} | ${u.email}`));
  }

  // Upsert a known admin account
  const email = 'admin@pharmora.com';
  const password = 'Admin@1234';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: {
      name: 'Admin',
      email,
      passwordHash,
      role: 'OWNER',
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log('\n=== ADMIN CREDENTIALS READY ===');
  console.log(`  Email   : ${admin.email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role    : ${admin.role}`);
  console.log('================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
