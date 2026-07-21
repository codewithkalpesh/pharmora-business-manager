// src/services/expense.service.js
const expenseRepository = require('../repositories/expense.repository');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const path = require('path');

const DEFAULT_CATEGORIES = [
  { name: 'Rent & Lease', icon: 'Building', color: '#ef4444', isDefault: true },
  { name: 'Utilities & Bills', icon: 'Zap', color: '#eab308', isDefault: true },
  { name: 'Salaries & Wages', icon: 'UserCheck', color: '#3b82f6', isDefault: true },
  { name: 'Maintenance & Cleaning', icon: 'Wrench', color: '#06b6d4', isDefault: true },
  { name: 'Stationery & Printing', icon: 'FileText', color: '#a855f7', isDefault: true },
  { name: 'Tea & Snacks', icon: 'Coffee', color: '#f97316', isDefault: true },
  { name: 'Miscellaneous', icon: 'HelpCircle', color: '#64748b', isDefault: true },
];

class ExpenseService {
  async createExpense(data, file, userId) {
    // Seed default categories if none exist
    await this.ensureCategoriesSeeded();

    const payload = {
      date: new Date(data.date),
      categoryId: data.categoryId,
      description: data.description,
      amount: parseFloat(data.amount),
      paymentMode: data.paymentMode || 'CASH',
      isRecurring: data.isRecurring === 'true' || data.isRecurring === true,
      notes: data.notes,
      createdById: userId,
    };

    if (file) {
      payload.receiptUrl = `/uploads/receipts/${file.filename}`;
    }

    const expense = await expenseRepository.createExpense(payload);

    // Sync payment withdrawal if a bank account is specified and paymentMode is not CASH
    if (data.bankAccountId && data.paymentMode !== 'CASH') {
      await this._syncExpenseToBank(expense, data.bankAccountId);
    }

    // Sync to Recurring Transactions module if isRecurring is checked
    if (expense.isRecurring) {
      await this._syncExpenseToRecurring(expense);
    }

    // Sync CASH expense to CashBook entry history
    if (expense.paymentMode === 'CASH') {
      await this._syncExpenseToCashBook(expense);
    }

    return expense;
  }

  async getExpenses(query, userId) {
    await this.ensureCategoriesSeeded(userId);

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = { createdById: userId };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.description = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { date: 'desc' };

    const { expenses, total } = await expenseRepository.findExpenses({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateExpense(id, data, file, userId) {
    const existing = await expenseRepository.findExpenseById(id);
    if (!existing) {
      if (file) this.deleteDiskFile(file.path);
      throw new ApiError(404, 'Expense not found.');
    }

    // Lookup existing bank transaction to find the old bank account and amount
    const prisma = require('../config/prisma');
    const tag = `[Expense:${existing.id}]`;
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } }
    });

    const oldBankAccountId = existingTxn ? existingTxn.accountId : null;
    const oldAmount = existingTxn ? Number(existingTxn.amount) : 0;

    const payload = {
      date: data.date ? new Date(data.date) : existing.date,
      categoryId: data.categoryId || existing.categoryId,
      description: data.description || existing.description,
      amount: data.amount ? parseFloat(data.amount) : existing.amount,
      paymentMode: data.paymentMode || existing.paymentMode,
      isRecurring: data.isRecurring !== undefined ? (data.isRecurring === 'true' || data.isRecurring === true) : existing.isRecurring,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    if (file) {
      // Remove old file if it exists
      if (existing.receiptUrl) {
        const oldPath = path.join(process.cwd(), existing.receiptUrl);
        this.deleteDiskFile(oldPath);
      }
      payload.receiptUrl = `/uploads/receipts/${file.filename}`;
    }

    const updatedExpense = await expenseRepository.updateExpense(id, payload);

    // If paymentMode changed to CASH, delete existing transaction. Else sync
    if (data.paymentMode === 'CASH') {
      await this._cleanupExpenseBankSync(existing);
    } else {
      const targetBankAccountId = data.bankAccountId || oldBankAccountId;
      if (targetBankAccountId) {
        await this._syncExpenseToBank(updatedExpense, targetBankAccountId, oldAmount, oldBankAccountId);
      }
    }

    return updatedExpense;
  }

  async deleteExpense(id) {
    const existing = await expenseRepository.findExpenseById(id);
    if (!existing) {
      throw new ApiError(404, 'Expense not found.');
    }

    if (existing.receiptUrl) {
      const filePath = path.join(process.cwd(), existing.receiptUrl);
      this.deleteDiskFile(filePath);
    }

    // Clean up any linked bank withdrawal transaction before deleting
    await this._cleanupExpenseBankSync(existing);

    return expenseRepository.deleteExpense(id);
  }

  async getCategories(userId) {
    await this.ensureCategoriesSeeded(userId);
    return expenseRepository.findCategories();
  }

  async createCategory(data) {
    const existing = await expenseRepository.findCategoryByName(data.name);
    if (existing) {
      throw new ApiError(400, `Category '${data.name}' already exists.`);
    }
    return expenseRepository.createCategory(data);
  }

  async getExpenseStats(query, userId) {
    const date = new Date();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthWhere = {
      createdById: userId,
      date: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth,
      },
    };

    // Filter stats by date range if requested
    const targetWhere = { createdById: userId };
    if (query.startDate || query.endDate) {
      targetWhere.date = {};
      if (query.startDate) targetWhere.date.gte = new Date(query.startDate);
      if (query.endDate) targetWhere.date.lte = new Date(query.endDate);
    } else {
      Object.assign(targetWhere, monthWhere);
    }

    const categorisedTotal = await expenseRepository.sumExpensesGroupedByCategory(targetWhere);
    
    // Calculate totals
    const totalAmount = categorisedTotal.reduce((sum, current) => sum + current.value, 0);

    return {
      totalAmount,
      breakdown: categorisedTotal,
    };
  }

  // Helpers
  async ensureCategoriesSeeded(userId) {
    const list = await expenseRepository.findCategories();
    if (list.length === 0) {
      await expenseRepository.seedDefaultCategories(DEFAULT_CATEGORIES);
    }
  }

  deleteDiskFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete file: ${filePath}`, err);
    });
  }

  /**
   * Create or update a WITHDRAWAL bank transaction tagged to an expense.
   * @param {object} expense - The expense record
   * @param {string} bankAccountId - Target bank account
   * @param {number} [oldAmount] - Previous transaction amount (for updates)
   * @param {string} [oldBankAccountId] - Previous bank account id (for account changes)
   */
  async _syncExpenseToBank(expense, bankAccountId, oldAmount = 0, oldBankAccountId = null) {
    const prisma = require('../config/prisma');
    const bankRepository = require('../repositories/bank.repository');

    const tag = `[Expense:${expense.id}]`;
    const description = `Expense: ${expense.description} ${tag}`;
    const amount = Number(expense.amount);

    // Look for an existing tagged transaction
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (existingTxn) {
      const prevAmount = Number(existingTxn.amount);
      const prevAccountId = existingTxn.accountId;

      // If the bank account changed, reverse on old and create on new
      if (oldBankAccountId && oldBankAccountId !== bankAccountId) {
        // Reverse old
        await bankRepository.adjustBalance(prevAccountId, prevAmount);
        await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
        // Create new
        const account = await bankRepository.findAccountById(bankAccountId);
        if (!account) return;
        const newBalance = Number(account.currentBalance) - amount;
        await prisma.bankTransaction.create({
          data: {
            accountId: bankAccountId,
            type: 'WITHDRAWAL',
            date: expense.date || new Date(),
            amount,
            description,
            runningBalance: newBalance,
            createdById: expense.createdById,
          },
        });
        await bankRepository.adjustBalance(bankAccountId, -amount);
      } else {
        // Same account – adjust the delta
        const delta = amount - prevAmount;
        if (delta !== 0) {
          await prisma.bankTransaction.update({
            where: { id: existingTxn.id },
            data: { amount, description },
          });
          await bankRepository.adjustBalance(bankAccountId, -delta);
        } else {
          // Amount same, just update description in case it changed
          await prisma.bankTransaction.update({
            where: { id: existingTxn.id },
            data: { description },
          });
        }
      }
    } else {
      // No existing transaction – create a fresh WITHDRAWAL
      const account = await bankRepository.findAccountById(bankAccountId);
      if (!account) return;
      const newBalance = Number(account.currentBalance) - amount;
      await prisma.bankTransaction.create({
        data: {
          accountId: bankAccountId,
          type: 'WITHDRAWAL',
          date: expense.date || new Date(),
          amount,
          description,
          runningBalance: newBalance,
          createdById: expense.createdById,
        },
      });
      await bankRepository.adjustBalance(bankAccountId, -amount);
    }
  }

  /**
   * Automatically create a RecurringTransaction entry when an expense is marked as recurring.
   */
  async _syncExpenseToRecurring(expense) {
    const prisma = require('../config/prisma');
    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        title: expense.description,
        createdById: expense.createdById,
        type: 'EXPENSE',
      },
    });

    if (!existing) {
      const startDate = new Date(expense.date);
      const nextDueDate = new Date(startDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      await prisma.recurringTransaction.create({
        data: {
          title: expense.description,
          description: `Recurring operating expense (${expense.notes || ''})`.trim(),
          amount: expense.amount,
          type: 'EXPENSE',
          frequency: 'MONTHLY',
          action: 'REMINDER_ONLY',
          startDate,
          nextDueDate,
          isActive: true,
          createdById: expense.createdById,
        },
      });
    }
  }

  /**
   * Update CashBook totalExpenses for the expense date when a CASH expense is recorded.
   */
  async _syncExpenseToCashBook(expense) {
    const prisma = require('../config/prisma');
    const expenseDate = new Date(expense.date);
    const startOfDay = new Date(expenseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setHours(23, 59, 59, 999);

    let cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: expense.createdById,
      },
    });

    const expAmount = Number(expense.amount);

    if (cashBook) {
      const newTotalExp = Number(cashBook.totalExpenses) + expAmount;
      const expectedClosing = Number(cashBook.openingCash) + Number(cashBook.cashSales) - newTotalExp;
      const newDifference = Number(cashBook.closingCash) - expectedClosing;

      await prisma.cashBook.update({
        where: { id: cashBook.id },
        data: {
          totalExpenses: newTotalExp,
          cashDifference: newDifference,
        },
      });
    } else {
      // Create a CashBook entry for the date if none exists
      await prisma.cashBook.create({
        data: {
          date: startOfDay,
          openingCash: 0,
          cashSales: 0,
          upiReceipts: 0,
          cardReceipts: 0,
          otherIncome: 0,
          totalExpenses: expAmount,
          bankDeposit: 0,
          closingCash: 0,
          cashDifference: -expAmount,
          notes: `Auto-created from expense: ${expense.description}`,
          createdById: expense.createdById,
        },
      });
    }
  }
}

module.exports = new ExpenseService();
