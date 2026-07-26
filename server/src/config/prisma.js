// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

let basePrisma;

if (process.env.NODE_ENV === 'production') {
  basePrisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  basePrisma = global.__prisma;
}

// Extend Prisma Client to support automated bank running balance recalculation
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);

        if (model === 'BankTransaction') {
          const mutations = ['create', 'update', 'delete', 'deleteMany', 'createMany', 'updateMany', 'upsert'];
          if (mutations.includes(operation)) {
            let accountIds = [];
            if (operation === 'create' && args?.data?.accountId) {
              accountIds.push(args.data.accountId);
              if (args.data.transferToId) accountIds.push(args.data.transferToId);
            }
            
            setImmediate(async () => {
              try {
                if (accountIds.length > 0) {
                  for (const id of accountIds) {
                    await recalculateAccountRunningBalances(id);
                  }
                } else {
                  const accounts = await basePrisma.bankAccount.findMany({ select: { id: true } });
                  for (const acc of accounts) {
                    await recalculateAccountRunningBalances(acc.id);
                  }
                }
              } catch (err) {
                console.error('Error recalculating running balances in extension:', err);
              }
            });
          }
        }

        if (model === 'BankAccount' && operation === 'update') {
          const accountId = args?.where?.id;
          if (accountId) {
            setImmediate(async () => {
              try {
                await recalculateAccountRunningBalances(accountId);
              } catch (err) {
                console.error('Error recalculating account balance in extension:', err);
              }
            });
          }
        }

        return result;
      }
    }
  }
});

async function recalculateAccountRunningBalances(accountId) {
  const account = await basePrisma.bankAccount.findUnique({
    where: { id: accountId }
  });
  if (!account) return;

  const transactions = await basePrisma.bankTransaction.findMany({
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
      await basePrisma.bankTransaction.update({
        where: { id: tx.id },
        data: { runningBalance: balance }
      });
    }
  }

  // Update currentBalance of the bank account to match the final transaction balance
  if (Number(account.currentBalance) !== balance) {
    await basePrisma.bankAccount.update({
      where: { id: accountId },
      data: { currentBalance: balance }
    });
  }
}

module.exports = prisma;
