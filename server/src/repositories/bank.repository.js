const prisma = require('../config/prisma');

class BankRepository {
  // ─── Bank Account CRUD ──────────────────────────────────────────────────────

  async createAccount(data) {
    return prisma.bankAccount.create({ data });
  }

  async findAccounts(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [accounts, total] = await Promise.all([
      prisma.bankAccount.findMany({
        skip,
        take,
        where,
        orderBy,
      }),
      prisma.bankAccount.count({ where }),
    ]);

    return { accounts, total };
  }

  async findAccountById(id) {
    return prisma.bankAccount.findUnique({ where: { id } });
  }

  async findAccountByName(bankName, accountName, userId) {
    const where = {
      bankName: { equals: bankName, mode: 'insensitive' },
      accountName: { equals: accountName, mode: 'insensitive' },
    };
    if (userId) where.createdById = userId;

    return prisma.bankAccount.findFirst({ where });
  }

  async updateAccount(id, data) {
    return prisma.bankAccount.update({ where: { id }, data });
  }

  async deleteAccount(id) {
    return prisma.bankAccount.delete({ where: { id } });
  }

  // ─── Bank Transaction CRUD ──────────────────────────────────────────────────

  async createTransaction(data) {
    return prisma.bankTransaction.create({
      data,
      include: {
        account: { select: { id: true, bankName: true, accountName: true, currentBalance: true } },
        transferTo: { select: { id: true, bankName: true, accountName: true, currentBalance: true } },
      },
    });
  }

  async findTransactions(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [transactions, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          account: { select: { id: true, bankName: true, accountName: true } },
          transferTo: { select: { id: true, bankName: true, accountName: true } },
          transferFrom: { select: { id: true, bankName: true, accountName: true } },
        },
      }),
      prisma.bankTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async findTransactionById(id) {
    return prisma.bankTransaction.findUnique({
      where: { id },
      include: {
        account: true,
        transferTo: true,
        transferFrom: true,
      },
    });
  }

  async deleteTransaction(id) {
    return prisma.bankTransaction.delete({ where: { id } });
  }

  // ─── Balance Operations ─────────────────────────────────────────────────────

  async adjustBalance(accountId, delta) {
    return prisma.bankAccount.update({
      where: { id: accountId },
      data: { currentBalance: { increment: delta } },
    });
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getBankStats(userId) {
    const whereAcc = { isActive: true };
    if (userId) whereAcc.createdById = userId;

    const accounts = await prisma.bankAccount.findMany({
      where: whereAcc,
      select: { id: true, bankName: true, accountName: true, currentBalance: true },
    });

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const whereDep = {
      type: 'DEPOSIT',
      date: { gte: monthStart, lte: monthEnd },
    };
    const whereWith = {
      type: 'WITHDRAWAL',
      date: { gte: monthStart, lte: monthEnd },
    };

    if (userId) {
      whereDep.createdById = userId;
      whereWith.createdById = userId;
    }

    const [monthDeposits, monthWithdrawals] = await Promise.all([
      prisma.bankTransaction.aggregate({
        where: whereDep,
        _sum: { amount: true },
      }),
      prisma.bankTransaction.aggregate({
        where: whereWith,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalBalance,
      accountCount: accounts.length,
      monthDeposits: Number(monthDeposits._sum.amount || 0),
      monthWithdrawals: Number(monthWithdrawals._sum.amount || 0),
      accounts,
    };
  }
}

module.exports = new BankRepository();
