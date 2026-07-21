// clear_data.js — Wipes all business data, keeps users
// Run from server/ directory: node clear_data.js
require('dotenv').config();
const prisma = require('./src/config/prisma');

async function main() {
  console.log('\n⚠️  Clearing all business data from the database...\n');

  // Delete in dependency order (children before parents)
  const r1 = await prisma.auditLog.deleteMany();
  console.log(`  Deleted ${r1.count} audit logs`);

  const r2 = await prisma.notification.deleteMany();
  console.log(`  Deleted ${r2.count} notifications`);

  const r3 = await prisma.recurringTransaction.deleteMany();
  console.log(`  Deleted ${r3.count} recurring transactions`);

  const r4 = await prisma.creditCollection.deleteMany();
  console.log(`  Deleted ${r4.count} credit collections`);

  const r5 = await prisma.customerCredit.deleteMany();
  console.log(`  Deleted ${r5.count} customer credits`);

  const r6 = await prisma.customer.deleteMany();
  console.log(`  Deleted ${r6.count} customers`);

  const r7 = await prisma.distributorPayment.deleteMany();
  console.log(`  Deleted ${r7.count} distributor payments`);

  const r8 = await prisma.purchaseBill.deleteMany();
  console.log(`  Deleted ${r8.count} purchase bills`);

  const r9 = await prisma.distributor.deleteMany();
  console.log(`  Deleted ${r9.count} distributors`);

  const r10 = await prisma.bankTransaction.deleteMany();
  console.log(`  Deleted ${r10.count} bank transactions`);

  const r11 = await prisma.bankAccount.deleteMany();
  console.log(`  Deleted ${r11.count} bank accounts`);

  const r12 = await prisma.expense.deleteMany();
  console.log(`  Deleted ${r12.count} expenses`);

  const r13 = await prisma.expenseCategory.deleteMany();
  console.log(`  Deleted ${r13.count} expense categories`);

  const r14 = await prisma.cashBook.deleteMany();
  console.log(`  Deleted ${r14.count} cash book entries`);

  console.log('\n✅ All business data cleared. Users are preserved.\n');

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  console.log('=== Remaining Users ===');
  users.forEach((u) => console.log(`  [${u.role}] ${u.name} (${u.email})`));
  console.log('=======================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
