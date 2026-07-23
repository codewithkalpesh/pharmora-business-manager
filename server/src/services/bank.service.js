const bankRepository = require('../repositories/bank.repository');
const ApiError = require('../utils/ApiError');

class BankService {
  // ─── Account Services ───────────────────────────────────────────────────────

  async createAccount(data, userId) {
    const existing = await bankRepository.findAccountByName(data.bankName, data.accountName, userId);
    if (existing) {
      throw new ApiError(400, `Account '${data.accountName}' at '${data.bankName}' already exists.`);
    }

    const prisma = require('../config/prisma');

    // Automatically make first account primary, else use checked status
    const count = await prisma.bankAccount.count({ where: { createdById: userId } });
    const isPrimary = count === 0 ? true : !!data.isPrimary;

    const payload = {
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber || null,
      ifscCode: data.ifscCode || null,
      openingBalance: data.openingBalance || 0,
      currentBalance: data.openingBalance || 0,
      isPrimary,
      createdById: userId,
    };

    if (isPrimary) {
      return prisma.$transaction(async (tx) => {
        await tx.bankAccount.updateMany({
          where: { createdById: userId },
          data: { isPrimary: false },
        });
        return tx.bankAccount.create({ data: payload });
      });
    }

    return bankRepository.createAccount(payload);
  }

  async getAccounts(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;
    if (query.search) {
      where.OR = [
        { bankName: { contains: query.search, mode: 'insensitive' } },
        { accountName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const orderBy = [
      { isPrimary: 'desc' },
      { bankName: 'asc' }
    ];

    const { accounts, total } = await bankRepository.findAccounts({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      accounts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateAccount(id, data, userId) {
    const existing = await bankRepository.findAccountById(id);
    if (!existing) throw new ApiError(404, 'Bank account not found.');
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to edit this bank account.');
    }

    const payload = {};
    if (data.bankName !== undefined) payload.bankName = data.bankName;
    if (data.accountName !== undefined) payload.accountName = data.accountName;
    if (data.accountNumber !== undefined) payload.accountNumber = data.accountNumber || null;
    if (data.ifscCode !== undefined) payload.ifscCode = data.ifscCode || null;
    if (data.isPrimary !== undefined) payload.isPrimary = !!data.isPrimary;

    if (payload.isPrimary) {
      const prisma = require('../config/prisma');
      return prisma.$transaction(async (tx) => {
        await tx.bankAccount.updateMany({
          where: { createdById: userId },
          data: { isPrimary: false },
        });
        return tx.bankAccount.update({ where: { id }, data: payload });
      });
    }

    return bankRepository.updateAccount(id, payload);
  }

  async setPrimaryAccount(id, userId) {
    const prisma = require('../config/prisma');
    const existing = await bankRepository.findAccountById(id);
    if (!existing) throw new ApiError(404, 'Bank account not found.');
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to modify this bank account.');
    }

    await prisma.$transaction([
      prisma.bankAccount.updateMany({
        where: { createdById: userId },
        data: { isPrimary: false },
      }),
      prisma.bankAccount.update({
        where: { id },
        data: { isPrimary: true },
      }),
    ]);

    return bankRepository.findAccountById(id);
  }

  async deleteAccount(id, userId) {
    const existing = await bankRepository.findAccountById(id);
    if (!existing) throw new ApiError(404, 'Bank account not found.');
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this bank account.');
    }

    const wasPrimary = existing.isPrimary;

    try {
      const deleted = await bankRepository.deleteAccount(id);

      if (wasPrimary) {
        const prisma = require('../config/prisma');
        const nextAccount = await prisma.bankAccount.findFirst({
          where: { createdById: userId, isActive: true },
          orderBy: { createdAt: 'asc' },
        });
        if (nextAccount) {
          await prisma.bankAccount.update({
            where: { id: nextAccount.id },
            data: { isPrimary: true },
          });
        }
      }

      return deleted;
    } catch (err) {
      throw new ApiError(400, 'Cannot delete account. There are transactions recorded against it.');
    }
  }

  // ─── Transaction Services ───────────────────────────────────────────────────

  async createTransaction(data, userId) {
    const account = await bankRepository.findAccountById(data.accountId);
    if (!account) throw new ApiError(404, 'Bank account not found.');

    const amount = parseFloat(data.amount);
    let newBalance = Number(account.currentBalance);
    let transferToAccount = null;

    if (data.type === 'DEPOSIT') {
      newBalance += amount;
    } else if (data.type === 'WITHDRAWAL') {
      newBalance -= amount;
      // Allow negative balance (overdraft) but warn – don't block
    } else if (data.type === 'TRANSFER') {
      if (!data.transferToId) {
        throw new ApiError(400, 'Destination account is required for transfers.');
      }
      if (data.transferToId === data.accountId) {
        throw new ApiError(400, 'Cannot transfer to the same account.');
      }
      transferToAccount = await bankRepository.findAccountById(data.transferToId);
      if (!transferToAccount) throw new ApiError(404, 'Destination bank account not found.');

      newBalance -= amount;
    }

    // Create the transaction
    const txnPayload = {
      accountId: data.accountId,
      type: data.type,
      date: new Date(data.date),
      amount,
      description: data.description,
      referenceNo: data.referenceNo || null,
      transferToId: data.type === 'TRANSFER' ? data.transferToId : null,
      runningBalance: newBalance,
      createdById: userId,
    };

    const transaction = await bankRepository.createTransaction(txnPayload);

    // Update source account balance
    const delta = data.type === 'DEPOSIT' ? amount : -amount;
    await bankRepository.adjustBalance(data.accountId, delta);

    // For transfers, also update destination
    if (data.type === 'TRANSFER' && data.transferToId) {
      await bankRepository.adjustBalance(data.transferToId, amount);

      // Create a mirror DEPOSIT record on the destination account
      const destBalance = Number(transferToAccount.currentBalance) + amount;
      await bankRepository.createTransaction({
        accountId: data.transferToId,
        type: 'DEPOSIT',
        date: new Date(data.date),
        amount,
        description: `Transfer from ${account.bankName} - ${account.accountName}`,
        referenceNo: data.referenceNo || null,
        transferFromId: data.accountId,
        runningBalance: destBalance,
        createdById: userId,
      });
    }

    return transaction;
  }

  async getTransactions(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;
    if (query.accountId) where.accountId = query.accountId;
    if (query.type) where.type = query.type;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.description = { contains: query.search, mode: 'insensitive' };
    }

    const orderBy = { date: 'desc' };

    const { transactions, total } = await bankRepository.findTransactions({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteTransaction(id) {
    const txn = await bankRepository.findTransactionById(id);
    if (!txn) throw new ApiError(404, 'Transaction not found.');

    // Reverse the balance change
    if (txn.type === 'DEPOSIT') {
      await bankRepository.adjustBalance(txn.accountId, -Number(txn.amount));
    } else if (txn.type === 'WITHDRAWAL') {
      await bankRepository.adjustBalance(txn.accountId, Number(txn.amount));
    } else if (txn.type === 'TRANSFER') {
      // Reverse source (add back)
      await bankRepository.adjustBalance(txn.accountId, Number(txn.amount));
      // Reverse destination (subtract)
      if (txn.transferToId) {
        await bankRepository.adjustBalance(txn.transferToId, -Number(txn.amount));
      }
    }

    await bankRepository.deleteTransaction(id);
    return { message: 'Transaction deleted and balances reversed.' };
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getBankStats(userId) {
    return bankRepository.getBankStats(userId);
  }
}

module.exports = new BankService();
