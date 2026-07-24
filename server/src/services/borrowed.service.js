// src/services/borrowed.service.js
const borrowedRepository = require('../repositories/borrowed.repository');
const broadcastService = require('./broadcast.service');
const notificationService = require('./notification.service');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class BorrowedService {
  async createBorrowed(data, userId) {
    const borrowedAmount = Number(data.borrowedAmount || 0);
    const targetAmount = Number(data.targetAmount !== undefined ? data.targetAmount : borrowedAmount);

    if (borrowedAmount <= 0) {
      throw new ApiError(400, 'Borrowed amount must be greater than zero.');
    }

    const payload = {
      personName: data.personName?.trim(),
      phone: data.phone?.trim() || null,
      borrowedAmount,
      targetAmount,
      paidAmount: 0,
      borrowDate: new Date(data.borrowDate || Date.now()),
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      status: 'PENDING',
      notes: data.notes?.trim() || null,
      paymentMode: data.paymentMode || 'CASH',
      createdById: userId,
    };

    if (!payload.personName) {
      throw new ApiError(400, 'Person / Lender name is required.');
    }

    const item = await borrowedRepository.create(payload);

    // Sync to CashBook or Bank Account
    if (item.paymentMode === 'CASH') {
      await this._syncBorrowedToCashBook(item);
    } else {
      await this._syncBorrowedToBank(item);
    }

    // Create a reminder notification if targetDate is provided
    if (item.targetDate) {
      await this._createOrUpdateReminderNotification(item, userId);
    }

    // Trigger Group Link broadcast
    broadcastService.broadcastTransaction({
      userId,
      type: 'BORROWED_MONEY',
      amount: item.borrowedAmount,
      partyName: item.personName,
      description: item.notes || `Borrowed from ${item.personName}`,
      paymentMode: item.paymentMode,
      date: item.borrowDate,
      extraDetails: {
        targetDate: item.targetDate,
        targetAmount: item.targetAmount,
      },
    });

    return item;
  }

  async getBorrowedList(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    let where = { createdById: userId };

    if (query.search?.trim()) {
      where.personName = { contains: query.search.trim(), mode: 'insensitive' };
    }

    if (query.status && query.status !== 'ALL') {
      if (query.status === 'OVERDUE') {
        where.status = { in: ['PENDING', 'PARTIAL'] };
        where.targetDate = { lt: new Date() };
      } else {
        where.status = query.status;
      }
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { createdAt: 'desc' };

    const { items, total } = await borrowedRepository.findAll({ skip, take: limit, where, orderBy });

    // Process status (dynamically flag OVERDUE)
    const processed = items.map((item) => {
      const remaining = Math.max(0, Number(item.targetAmount) - Number(item.paidAmount));
      const isOverdue =
        item.status !== 'PAID' &&
        item.targetDate &&
        new Date(item.targetDate) < new Date();

      return {
        ...item,
        borrowedAmount: Number(item.borrowedAmount),
        targetAmount: Number(item.targetAmount),
        paidAmount: Number(item.paidAmount),
        remainingAmount: remaining,
        isOverdue,
        displayStatus: isOverdue ? 'OVERDUE' : item.status,
      };
    });

    const summary = await borrowedRepository.getSummary(userId);

    // Also trigger background reminder check for active due dates
    this.checkAndGenerateDueReminders(userId).catch(() => {});

    return {
      items: processed,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBorrowedById(id, userId) {
    const item = await borrowedRepository.findById(id);
    if (!item) {
      throw new ApiError(404, 'Borrowed money record not found.');
    }
    if (item.createdById !== userId) {
      throw new ApiError(403, 'Access denied.');
    }

    const remaining = Math.max(0, Number(item.targetAmount) - Number(item.paidAmount));
    const isOverdue =
      item.status !== 'PAID' && item.targetDate && new Date(item.targetDate) < new Date();

    return {
      ...item,
      borrowedAmount: Number(item.borrowedAmount),
      targetAmount: Number(item.targetAmount),
      paidAmount: Number(item.paidAmount),
      remainingAmount: remaining,
      isOverdue,
      displayStatus: isOverdue ? 'OVERDUE' : item.status,
    };
  }

  async updateBorrowed(id, data, userId) {
    const existing = await borrowedRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Borrowed money record not found.');
    }
    if (existing.createdById !== userId) {
      throw new ApiError(403, 'Access denied.');
    }

    const oldPaymentMode = existing.paymentMode;
    const oldAmount = Number(existing.borrowedAmount);
    const oldDate = existing.borrowDate;

    const updateData = {};
    if (data.personName !== undefined) updateData.personName = data.personName.trim();
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.paymentMode !== undefined) updateData.paymentMode = data.paymentMode;
    if (data.borrowDate !== undefined) updateData.borrowDate = new Date(data.borrowDate);
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    if (data.targetAmount !== undefined) updateData.targetAmount = Number(data.targetAmount);
    if (data.borrowedAmount !== undefined) updateData.borrowedAmount = Number(data.borrowedAmount);

    // Recalculate status
    const currentPaid = Number(existing.paidAmount);
    const target = updateData.targetAmount !== undefined ? updateData.targetAmount : Number(existing.targetAmount);

    if (currentPaid >= target) {
      updateData.status = 'PAID';
    } else if (currentPaid > 0) {
      updateData.status = 'PARTIAL';
    } else {
      updateData.status = 'PENDING';
    }

    const updated = await borrowedRepository.update(id, updateData);

    // Sync updates to CashBook/Bank Account
    if (oldPaymentMode === 'CASH') {
      await this._cleanupBorrowedFromCashBook({ ...existing, borrowedAmount: oldAmount, borrowDate: oldDate });
    } else {
      await this._cleanupBorrowedBankSync({ id, paymentMode: oldPaymentMode });
    }

    if (updated.paymentMode === 'CASH') {
      await this._syncBorrowedToCashBook(updated);
    } else {
      await this._syncBorrowedToBank(updated);
    }

    if (updated.targetDate) {
      await this._createOrUpdateReminderNotification(updated, userId);
    }

    return updated;
  }

  async deleteBorrowed(id, userId) {
    const existing = await borrowedRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, 'Borrowed money record not found.');
    }
    if (existing.createdById !== userId) {
      throw new ApiError(403, 'Access denied.');
    }

    // Clean up sync
    if (existing.paymentMode === 'CASH') {
      await this._cleanupBorrowedFromCashBook(existing);
    } else {
      await this._cleanupBorrowedBankSync(existing);
    }

    return borrowedRepository.delete(id);
  }

  // ─── Repayments Logic ───────────────────────────────────────────────────────

  async addRepayment(borrowedId, data, userId) {
    const borrowed = await borrowedRepository.findById(borrowedId);
    if (!borrowed) {
      throw new ApiError(404, 'Borrowed money record not found.');
    }
    if (borrowed.createdById !== userId) {
      throw new ApiError(403, 'Access denied.');
    }

    const repaymentAmount = Number(data.amount || 0);
    if (repaymentAmount <= 0) {
      throw new ApiError(400, 'Repayment amount must be greater than zero.');
    }

    const repayment = await borrowedRepository.createRepayment({
      borrowedMoneyId: borrowedId,
      repaymentDate: new Date(data.repaymentDate || Date.now()),
      amount: repaymentAmount,
      paymentMode: data.paymentMode || 'CASH',
      referenceNo: data.referenceNo?.trim() || null,
      notes: data.notes?.trim() || null,
      createdById: userId,
    });

    // Update aggregate paid amount and status on parent borrowed record
    const updatedPaid = Number(borrowed.paidAmount) + repaymentAmount;
    const target = Number(borrowed.targetAmount);
    let newStatus = borrowed.status;

    if (updatedPaid >= target) {
      newStatus = 'PAID';
    } else if (updatedPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await borrowedRepository.update(borrowedId, {
      paidAmount: updatedPaid,
      status: newStatus,
    });

    // Sync to Bank if not CASH
    if (repayment.paymentMode !== 'CASH') {
      await this._syncRepaymentToBank(repayment, userId);
    }

    // Recalculate CashBook daily totalExpenses and cashExpenses
    const cashBookService = require('./cashbook.service');
    await cashBookService.syncTotalExpenses(userId, repayment.repaymentDate);

    const remainingBalance = Math.max(0, target - updatedPaid);

    // Group Link Broadcast
    broadcastService.broadcastTransaction({
      userId,
      type: 'BORROWED_REPAYMENT',
      amount: repaymentAmount,
      partyName: borrowed.personName,
      description: data.notes || `Repaid money to ${borrowed.personName}`,
      paymentMode: data.paymentMode || 'CASH',
      date: repayment.repaymentDate,
      extraDetails: {
        remainingBalance,
      },
    });

    return repayment;
  }

  async deleteRepayment(repaymentId, userId) {
    const repayment = await borrowedRepository.findRepaymentById(repaymentId);
    if (!repayment) {
      throw new ApiError(404, 'Repayment record not found.');
    }
    if (repayment.createdById !== userId) {
      throw new ApiError(403, 'Access denied.');
    }

    const borrowedId = repayment.borrowedMoneyId;
    const borrowed = await borrowedRepository.findById(borrowedId);

    const repaymentDate = repayment.repaymentDate;
    const paymentMode = repayment.paymentMode;

    await borrowedRepository.deleteRepayment(repaymentId);

    if (borrowed) {
      const newPaid = Math.max(0, Number(borrowed.paidAmount) - Number(repayment.amount));
      const target = Number(borrowed.targetAmount);
      let newStatus = 'PENDING';
      if (newPaid >= target) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIAL';

      await borrowedRepository.update(borrowedId, {
        paidAmount: newPaid,
        status: newStatus,
      });
    }

    // Clean up bank sync
    if (paymentMode !== 'CASH') {
      await this._cleanupRepaymentBankSync(repayment);
    }

    // Recalculate CashBook daily totalExpenses and cashExpenses
    const cashBookService = require('./cashbook.service');
    await cashBookService.syncTotalExpenses(userId, repaymentDate);

    return { message: 'Repayment deleted successfully.' };
  }

  // ─── Payment Reminder & Notification Engine ─────────────────────────────────

  async checkAndGenerateDueReminders(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all unpaid borrowed items where targetDate <= today
      const dueItems = await prisma.borrowedMoney.findMany({
        where: {
          createdById: userId,
          status: { in: ['PENDING', 'PARTIAL'] },
          targetDate: { lte: new Date() },
        },
      });

      for (const item of dueItems) {
        await this._createOrUpdateReminderNotification(item, userId);
      }
    } catch (err) {
      console.error('[BorrowedService] Failed to check payment reminders:', err.message);
    }
  }

  async _createOrUpdateReminderNotification(borrowedItem, userId) {
    const remaining = Math.max(0, Number(borrowedItem.targetAmount) - Number(borrowedItem.paidAmount));
    if (remaining <= 0) return;

    const formattedTargetDate = borrowedItem.targetDate
      ? new Date(borrowedItem.targetDate).toLocaleDateString('en-IN')
      : 'Today';

    const title = `Payment Reminder: Pay ${borrowedItem.personName}`;
    const message = `Reminder to pay ₹${Number(borrowedItem.targetAmount).toLocaleString('en-IN')} to ${borrowedItem.personName} (Target Date: ${formattedTargetDate}). Remaining balance: ₹${remaining.toLocaleString('en-IN')}.`;

    // Check if notification already exists for this borrowed item to avoid duplicate spam
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'due_reminder',
        message: { contains: borrowedItem.personName },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // created within last 24h
      },
    });

    if (!existing) {
      await notificationService.createNotification({
        userId,
        title,
        message,
        type: 'due_reminder',
        link: '/borrowed',
      });
    }
  }

  // ─── Bank & CashBook Sync Helpers ───────────────────────────────────────────

  async _syncBorrowedToCashBook(item) {
    const prisma = require('../config/prisma');
    const borrowDate = new Date(item.borrowDate);
    const startOfDay = new Date(borrowDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(borrowDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    let cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: item.createdById,
      },
    });

    const amt = Number(item.borrowedAmount);
    const mode = item.paymentMode || 'CASH';

    if (cashBook) {
      const field = mode === 'UPI' ? 'upiReceipts' : mode === 'CARD' ? 'cardReceipts' : 'otherIncome';
      const newReceipts = Number(cashBook[field]) + amt;

      const newSales = Number(cashBook.cashSales);
      const newUpi = mode === 'UPI' ? newReceipts : Number(cashBook.upiReceipts);
      const newCard = mode === 'CARD' ? newReceipts : Number(cashBook.cardReceipts);
      const newOther = field === 'otherIncome' ? newReceipts : Number(cashBook.otherIncome);

      const expectedClosing = Number(cashBook.openingCash) + newSales + newUpi + newCard + newOther - Number(cashBook.totalExpenses) - Number(cashBook.bankDeposit);
      const newDifference = Number(cashBook.closingCash) - expectedClosing;

      const updateData = { cashDifference: newDifference };
      updateData[field] = newReceipts;

      const updated = await prisma.cashBook.update({
        where: { id: cashBook.id },
        data: updateData,
      });

      if (mode === 'UPI') {
        const cashBookService = require('./cashbook.service');
        await cashBookService._syncUpiToBank(updated);
      }
    } else {
      const created = await prisma.cashBook.create({
        data: {
          date: startOfDay,
          openingCash: 0,
          cashSales: 0,
          upiReceipts: mode === 'UPI' ? amt : 0,
          cardReceipts: mode === 'CARD' ? amt : 0,
          otherIncome: (mode !== 'UPI' && mode !== 'CARD') ? amt : 0,
          totalExpenses: 0,
          bankDeposit: 0,
          closingCash: (mode !== 'UPI' && mode !== 'CARD') ? amt : 0,
          cashDifference: 0,
          notes: `Auto-created from borrowed money record (${item.personName})`,
          createdById: item.createdById,
        },
      });

      if (mode === 'UPI' && amt > 0) {
        const cashBookService = require('./cashbook.service');
        await cashBookService._syncUpiToBank(created);
      }
    }
  }

  async _cleanupBorrowedFromCashBook(item) {
    if (!item) return;
    const prisma = require('../config/prisma');
    const borrowDate = new Date(item.borrowDate);
    const startOfDay = new Date(borrowDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(borrowDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: item.createdById,
      },
    });

    if (cashBook) {
      const amt = Number(item.borrowedAmount);
      const mode = item.paymentMode || 'CASH';
      const field = mode === 'UPI' ? 'upiReceipts' : mode === 'CARD' ? 'cardReceipts' : 'otherIncome';
      const newReceipts = Math.max(0, Number(cashBook[field]) - amt);

      const updateData = {};
      updateData[field] = newReceipts;

      const newSales = Number(cashBook.cashSales);
      const newUpi = mode === 'UPI' ? newReceipts : Number(cashBook.upiReceipts);
      const newCard = mode === 'CARD' ? newReceipts : Number(cashBook.cardReceipts);
      const newOther = field === 'otherIncome' ? newReceipts : Number(cashBook.otherIncome);

      const expectedClosing = Number(cashBook.openingCash) + newSales + newUpi + newCard + newOther - Number(cashBook.totalExpenses) - Number(cashBook.bankDeposit);
      updateData.cashDifference = Number(cashBook.closingCash) - expectedClosing;

      const updated = await prisma.cashBook.update({
        where: { id: cashBook.id },
        data: updateData,
      });

      if (mode === 'UPI') {
        const cashBookService = require('./cashbook.service');
        await cashBookService._syncUpiToBank(updated);
      }
    }
  }

  async _syncBorrowedToBank(item) {
    const bankRepository = require('../repositories/bank.repository');
    const cashBookService = require('./cashbook.service');

    const amount = Number(item.borrowedAmount);
    const tag = `[BorrowedMoney:${item.id}]`;
    const description = `Borrowed from ${item.personName} ${tag}`;

    const primaryBank = await cashBookService._findPrimaryBankAccount(item.createdById);
    if (!primaryBank) return;

    const newBalance = Number(primaryBank.currentBalance) + amount;
    await prisma.bankTransaction.create({
      data: {
        accountId: primaryBank.id,
        type: 'DEPOSIT',
        date: item.borrowDate || new Date(),
        amount,
        description,
        runningBalance: newBalance,
        createdById: item.createdById,
      },
    });
    await bankRepository.adjustBalance(primaryBank.id, amount);
  }

  async _cleanupBorrowedBankSync(item) {
    const bankRepository = require('../repositories/bank.repository');
    const tag = `[BorrowedMoney:${item.id}]`;
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (existingTxn) {
      await bankRepository.adjustBalance(existingTxn.accountId, -Number(existingTxn.amount));
      await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
    }
  }

  async _syncRepaymentToBank(repayment, userId) {
    const bankRepository = require('../repositories/bank.repository');
    const cashBookService = require('./cashbook.service');

    const amount = Number(repayment.amount);
    const tag = `[Repayment:${repayment.id}]`;
    
    const borrowed = await prisma.borrowedMoney.findUnique({
      where: { id: repayment.borrowedMoneyId }
    });
    const lenderName = borrowed ? borrowed.personName : 'Lender';
    const description = `Repayment to ${lenderName} ${tag}`;

    const primaryBank = await cashBookService._findPrimaryBankAccount(userId);
    if (!primaryBank) return;

    const newBalance = Number(primaryBank.currentBalance) - amount;
    await prisma.bankTransaction.create({
      data: {
        accountId: primaryBank.id,
        type: 'WITHDRAWAL',
        date: repayment.repaymentDate || new Date(),
        amount,
        description,
        runningBalance: newBalance,
        createdById: userId,
      },
    });
    await bankRepository.adjustBalance(primaryBank.id, -amount);
  }

  async _cleanupRepaymentBankSync(repayment) {
    const bankRepository = require('../repositories/bank.repository');
    const tag = `[Repayment:${repayment.id}]`;
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (existingTxn) {
      await bankRepository.adjustBalance(existingTxn.accountId, Number(existingTxn.amount));
      await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
    }
  }
}

module.exports = new BorrowedService();
