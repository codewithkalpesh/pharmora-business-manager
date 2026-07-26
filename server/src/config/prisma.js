// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

// Add a middleware to automatically recalculate running balances for BankTransaction
prisma.$use(async (params, next) => {
  const result = await next(params);

  if (params.model === 'BankTransaction') {
    const mutations = ['create', 'update', 'delete', 'deleteMany', 'createMany', 'updateMany', 'upsert'];
    if (mutations.includes(params.action)) {
      let accountIds = [];
      if (params.action === 'create' && params.args?.data?.accountId) {
        accountIds.push(params.args.data.accountId);
        if (params.args.data.transferToId) accountIds.push(params.args.data.transferToId);
      }
      
      setImmediate(async () => {
        try {
          if (accountIds.length > 0) {
            for (const id of accountIds) {
              await recalculateAccountRunningBalances(id);
            }
          } else {
            const accounts = await prisma.bankAccount.findMany({ select: { id: true } });
            for (const acc of accounts) {
              await recalculateAccountRunningBalances(acc.id);
            }
          }
        } catch (err) {
          console.error('Error recalculating running balances in middleware:', err);
        }
      });
    }
  }

  if (params.model === 'BankAccount' && params.action === 'update') {
    const accountId = params.args?.where?.id;
    if (accountId) {
      setImmediate(async () => {
        try {
          await recalculateAccountRunningBalances(accountId);
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  return result;
});

async function recalculateAccountRunningBalances(accountId) {
  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId }
  });
  if (!account) return;

  const transactions = await prisma.bankTransaction.findMany({
    where: { accountId },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  let balance = Number(account.openingBalance || 0);

  for (const tx of transactions) {
    if (tx.type === 'DEPOSIT') {
      balance += Number(tx.amount);
    } else {
      balance -= Number(tx.amount);
    }

    if (Number(tx.runningBalance) !== balance) {
      await prisma.bankTransaction.update({
        where: { id: tx.id },
        data: { runningBalance: balance }
      });
    }
  }
}

module.exports = prisma;
