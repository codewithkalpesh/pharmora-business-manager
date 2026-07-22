// src/services/cashbook.service.js
const cashBookRepository = require('../repositories/cashbook.repository');
const broadcastService = require('./broadcast.service');
const ApiError = require('../utils/ApiError');

class CashBookService {
  async createEntry(data, userId) {
    const existing = await cashBookRepository.findByDate(data.date, userId);
    if (existing) {
      throw new ApiError(400, 'A cash book entry already exists for this date.');
    }

    // Prepare data
    const entryData = {
      date: new Date(data.date),
      openingCash: data.openingCash || 0,
      cashSales: data.cashSales || 0,
      upiReceipts: data.upiReceipts || 0,
      cardReceipts: data.cardReceipts || 0,
      otherIncome: data.otherIncome || 0,
      totalExpenses: data.totalExpenses || 0,
      bankDeposit: data.bankDeposit || 0,
      closingCash: data.closingCash || 0,
      cashDifference: data.cashDifference || 0,
      notes: data.notes,
      createdById: userId,
    };

    const entry = await cashBookRepository.create(entryData);

    // Sync UPI amount as DEPOSIT to primary bank account
    if (Number(entry.upiReceipts) > 0) {
      await this._syncUpiToBank(entry);
    }

    // Broadcast cashbook entry
    broadcastService.broadcastTransaction({
      userId,
      type: 'CASHBOOK',
      amount: entry.closingCash,
      description: entry.notes,
      date: entry.date,
      extraDetails: {
        openingCash: entry.openingCash,
        cashSales: entry.cashSales,
        upiReceipts: entry.upiReceipts,
        cardReceipts: entry.cardReceipts,
        otherIncome: entry.otherIncome,
        totalExpenses: entry.totalExpenses,
        bankDeposit: entry.bankDeposit,
        closingCash: entry.closingCash,
        cashDifference: entry.cashDifference,
      }
    }).catch(err => console.error('[CashBookService] Broadcast failed:', err.message));

    return entry;
  }

  async getEntries(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;
    
    let where = { createdById: userId };
    
    // Optional date range filters
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const orderBy = query.sortBy 
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { date: 'desc' };

    const { entries, total } = await cashBookRepository.findAll({ skip, take: limit, where, orderBy });
    
    return {
      entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntryByDate(date, userId) {
    const entry = await cashBookRepository.findByDate(date, userId);
    
    if (!entry) {
      // If no entry exists for today, fetch the previous entry to carry forward opening cash
      const previousEntry = await cashBookRepository.findPreviousEntry(date, userId);
      return {
        isNew: true,
        suggestedOpeningCash: previousEntry ? previousEntry.closingCash : 0,
      };
    }
    
    return { isNew: false, entry };
  }

  async updateEntry(id, data, userId) {
    const existing = await cashBookRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Cash book entry not found.');
    }
    // Ensure user owns this entry
    if (existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to update this entry.');
    }

    const updateData = {
      openingCash: data.openingCash !== undefined ? data.openingCash : existing.openingCash,
      cashSales: data.cashSales !== undefined ? data.cashSales : existing.cashSales,
      upiReceipts: data.upiReceipts !== undefined ? data.upiReceipts : existing.upiReceipts,
      cardReceipts: data.cardReceipts !== undefined ? data.cardReceipts : existing.cardReceipts,
      otherIncome: data.otherIncome !== undefined ? data.otherIncome : existing.otherIncome,
      totalExpenses: data.totalExpenses !== undefined ? data.totalExpenses : existing.totalExpenses,
      bankDeposit: data.bankDeposit !== undefined ? data.bankDeposit : existing.bankDeposit,
      closingCash: data.closingCash !== undefined ? data.closingCash : existing.closingCash,
      cashDifference: data.cashDifference !== undefined ? data.cashDifference : existing.cashDifference,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    const updated = await cashBookRepository.update(id, updateData);

    // Re-sync UPI amount (handles amount changes, removes if zero)
    await this._syncUpiToBank(updated);

    // Broadcast updated cashbook entry
    broadcastService.broadcastTransaction({
      userId,
      type: 'CASHBOOK',
      amount: updated.closingCash,
      description: `[UPDATED] ${updated.notes || ''}`,
      date: updated.date,
      extraDetails: {
        openingCash: updated.openingCash,
        cashSales: updated.cashSales,
        upiReceipts: updated.upiReceipts,
        cardReceipts: updated.cardReceipts,
        otherIncome: updated.otherIncome,
        totalExpenses: updated.totalExpenses,
        bankDeposit: updated.bankDeposit,
        closingCash: updated.closingCash,
        cashDifference: updated.cashDifference,
      }
    }).catch(err => console.error('[CashBookService] Broadcast failed:', err.message));

    return updated;
  }

  async deleteEntry(id, userId) {
    const existing = await cashBookRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Cash book entry not found.');
    }
    if (existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this entry.');
    }

    // Remove the linked UPI bank transaction before deleting entry
    await this._cleanupUpiFromBank(existing);

    return cashBookRepository.delete(id);
  }

  // ─── UPI → Bank Sync Helpers ─────────────────────────────────────────────────

  /**
   * Find the primary/default active bank account.
   * Looks for names containing "Primary" or "Main", falls back to first active.
   */
  async _findPrimaryBankAccount(userId) {
    const prisma = require('../config/prisma');

    const baseWhere = { isActive: true };
    if (userId) baseWhere.createdById = userId;

    // Try to find an account named "Primary" or "Main" (case-insensitive)
    let account = await prisma.bankAccount.findFirst({
      where: {
        ...baseWhere,
        OR: [
          { accountName: { contains: 'Primary', mode: 'insensitive' } },
          { accountName: { contains: 'Main', mode: 'insensitive' } },
        ],
      },
    });

    // Fall back to first active account
    if (!account) {
      account = await prisma.bankAccount.findFirst({
        where: baseWhere,
        orderBy: { createdAt: 'asc' },
      });
    }

    return account;
  }

  /**
   * Create or update a DEPOSIT bank transaction tagged to a CashBook entry's UPI receipts.
   */
  async _syncUpiToBank(entry) {
    const prisma = require('../config/prisma');
    const bankRepository = require('../repositories/bank.repository');

    const upiAmount = Number(entry.upiReceipts) || 0;
    const tag = `[CashBook:${entry.id}:UPI]`;
    const dateStr = new Date(entry.date).toLocaleDateString('en-IN');
    const description = `CashBook UPI Receipts – ${dateStr} ${tag}`;

    // Find existing tagged transaction
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (upiAmount <= 0) {
      // UPI is zero or removed – clean up any existing transaction
      if (existingTxn) {
        await bankRepository.adjustBalance(existingTxn.accountId, -Number(existingTxn.amount));
        await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
      }
      return;
    }

    if (existingTxn) {
      // Update the existing transaction – adjust delta
      const prevAmount = Number(existingTxn.amount);
      const delta = upiAmount - prevAmount;
      if (delta !== 0) {
        await prisma.bankTransaction.update({
          where: { id: existingTxn.id },
          data: { amount: upiAmount, description },
        });
        await bankRepository.adjustBalance(existingTxn.accountId, delta);
      }
    } else {
      // Create a new DEPOSIT
      const primaryAccount = await this._findPrimaryBankAccount(entry.createdById);
      if (!primaryAccount) return; // No bank accounts configured, skip silently

      const newBalance = Number(primaryAccount.currentBalance) + upiAmount;
      await prisma.bankTransaction.create({
        data: {
          accountId: primaryAccount.id,
          type: 'DEPOSIT',
          date: entry.date || new Date(),
          amount: upiAmount,
          description,
          runningBalance: newBalance,
          createdById: entry.createdById,
        },
      });
      await bankRepository.adjustBalance(primaryAccount.id, upiAmount);
    }
  }

  /**
   * Remove the tagged bank transaction for a CashBook entry's UPI receipts and reverse the balance.
   */
  async _cleanupUpiFromBank(entry) {
    const prisma = require('../config/prisma');
    const bankRepository = require('../repositories/bank.repository');

    const tag = `[CashBook:${entry.id}:UPI]`;
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (existingTxn) {
      // Reverse the deposit (subtract)
      await bankRepository.adjustBalance(existingTxn.accountId, -Number(existingTxn.amount));
      await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
    }
  }
}

module.exports = new CashBookService();
