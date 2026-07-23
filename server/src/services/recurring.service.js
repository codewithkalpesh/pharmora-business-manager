const recurringRepository = require('../repositories/recurring.repository');
const prisma = require('../config/prisma');
const cashBookService = require('./cashbook.service');
const ApiError = require('../utils/ApiError');

class RecurringService {
  // ─── Calculator Helper ─────────────────────────────────────────────────────

  calculateNextDueDate(currentDate, frequency, customDays) {
    const next = new Date(currentDate);
    if (frequency === 'DAILY') {
      next.setDate(next.getDate() + 1);
    } else if (frequency === 'WEEKLY') {
      next.setDate(next.getDate() + 7);
    } else if (frequency === 'MONTHLY') {
      next.setMonth(next.getMonth() + 1);
    } else if (frequency === 'QUARTERLY') {
      next.setMonth(next.getMonth() + 3);
    } else if (frequency === 'HALF_YEARLY') {
      next.setMonth(next.getMonth() + 6);
    } else if (frequency === 'YEARLY') {
      next.setFullYear(next.getFullYear() + 1);
    } else if (frequency === 'CUSTOM') {
      next.setDate(next.getDate() + (customDays || 1));
    }
    return next;
  }

  // ─── CRUD Services ─────────────────────────────────────────────────────────

  async createRecurring(data, userId) {
    const startDateObj = new Date(data.startDate);
    const payload = {
      title: data.title,
      description: data.description || null,
      amount: parseFloat(data.amount),
      type: data.type,
      frequency: data.frequency,
      action: data.action || 'REMINDER_ONLY',
      paymentMode: data.paymentMode || 'CASH',
      startDate: startDateObj,
      endDate: data.endDate ? new Date(data.endDate) : null,
      nextDueDate: startDateObj, // Start date is first due date
      customDays: data.customDays || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdById: userId,
    };

    const schedule = await recurringRepository.createRecurring(payload);

    // Auto-generate notification for the newly created schedule if due within 5 days
    try {
      const notificationService = require('./notification.service');
      await notificationService.generateUpcomingReminders(userId);
    } catch {}

    return schedule;
  }

  async getRecurrings(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;
    if (query.type) where.type = query.type;
    if (query.frequency) where.frequency = query.frequency;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = { nextDueDate: 'asc' };

    const { recurrings, total } = await recurringRepository.findRecurrings({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      recurrings,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRecurringById(id, userId) {
    const item = await recurringRepository.findRecurringById(id);
    if (!item) throw new ApiError(404, 'Recurring transaction schedule not found.');
    if (item.createdById && item.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to view this schedule.');
    }
    return item;
  }

  async updateRecurring(id, data, userId) {
    const existing = await recurringRepository.findRecurringById(id);
    if (!existing) throw new ApiError(404, 'Recurring transaction schedule not found.');
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to update this schedule.');
    }

    const payload = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.amount !== undefined) payload.amount = parseFloat(data.amount);
    if (data.type !== undefined) payload.type = data.type;
    if (data.frequency !== undefined) payload.frequency = data.frequency;
    if (data.action !== undefined) payload.action = data.action;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.customDays !== undefined) payload.customDays = data.customDays || null;
    if (data.paymentMode !== undefined) payload.paymentMode = data.paymentMode;

    if (data.startDate !== undefined) {
      payload.startDate = new Date(data.startDate);
      // If updating start date and it hasn't started execution, align nextDueDate
      if (existing.nextDueDate.getTime() === existing.startDate.getTime()) {
        payload.nextDueDate = payload.startDate;
      }
    }
    if (data.endDate !== undefined) {
      payload.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    return recurringRepository.updateRecurring(id, payload);
  }

  async deleteRecurring(id, userId) {
    const existing = await recurringRepository.findRecurringById(id);
    if (!existing) throw new ApiError(404, 'Recurring transaction schedule not found.');
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this schedule.');
    }
    return recurringRepository.deleteRecurring(id);
  }

  // ─── Execution Logic ────────────────────────────────────────────────────────

  async executeOccurrence(recurring, date) {
    const executionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (recurring.type === 'EXPENSE') {
      let category = await prisma.expenseCategory.findFirst({
        where: { name: { contains: 'Utilities', mode: 'insensitive' } },
      });

      if (!category) {
        category = await prisma.expenseCategory.findFirst();
      }

      if (!category) {
        await prisma.expenseCategory.createMany({
          data: [
            { name: 'Rent & Lease', icon: 'Building', color: '#ef4444', isDefault: true },
            { name: 'Utilities & Bills', icon: 'Zap', color: '#eab308', isDefault: true },
            { name: 'Salaries & Wages', icon: 'UserCheck', color: '#3b82f6', isDefault: true },
            { name: 'Miscellaneous', icon: 'HelpCircle', color: '#64748b', isDefault: true },
          ],
        });
        category = await prisma.expenseCategory.findFirst();
      }

      const expense = await prisma.expense.create({
        data: {
          date: executionDate,
          categoryId: category.id,
          description: `[RECURRING] ${recurring.title}`,
          amount: recurring.amount,
          paymentMode: recurring.paymentMode || 'CASH',
          isRecurring: true,
          notes: recurring.description || 'Executed from recurring schedule',
          createdById: recurring.createdById,
        },
      });

      // Sync payment withdrawal to primary bank account if not CASH
      if (expense.paymentMode !== 'CASH') {
        const primaryBank = await cashBookService._findPrimaryBankAccount(recurring.createdById);
        if (primaryBank) {
          const expenseService = require('./expense.service');
          await expenseService._syncExpenseToBank(expense, primaryBank.id);
        }
      }

      // Sync recurring expense to CashBook entry
      await cashBookService.syncTotalExpenses(recurring.createdById, executionDate);
    } else if (recurring.type === 'INCOME') {
      const existingCashBook = await prisma.cashBook.findFirst({
        where: { date: executionDate, createdById: recurring.createdById },
      });

      const amt = Number(recurring.amount);
      const mode = recurring.paymentMode || 'CASH';
      const field = mode === 'UPI' ? 'upiReceipts' : mode === 'CARD' ? 'cardReceipts' : mode === 'CASH' ? 'cashSales' : 'otherIncome';

      if (existingCashBook) {
        const currentFieldVal = Number(existingCashBook[field]) || 0;
        const newFieldVal = currentFieldVal + amt;

        const newSales = mode === 'CASH' ? newFieldVal : Number(existingCashBook.cashSales);
        const newUpi = mode === 'UPI' ? newFieldVal : Number(existingCashBook.upiReceipts);
        const newCard = mode === 'CARD' ? newFieldVal : Number(existingCashBook.cardReceipts);
        const newOther = mode !== 'CASH' && mode !== 'UPI' && mode !== 'CARD' ? (Number(existingCashBook.otherIncome) + amt) : Number(existingCashBook.otherIncome);

        const expectedClosing = Number(existingCashBook.openingCash) + newSales + newUpi + newCard + newOther - Number(existingCashBook.totalExpenses) - Number(existingCashBook.bankDeposit);
        const newDifference = Number(existingCashBook.closingCash) - expectedClosing;

        const updateData = {
          cashDifference: newDifference,
        };
        updateData[field] = newFieldVal;

        const updated = await prisma.cashBook.update({
          where: { id: existingCashBook.id },
          data: updateData,
        });

        if (mode === 'UPI') {
          await cashBookService._syncUpiToBank(updated);
        }
      } else {
        const prevEntry = await prisma.cashBook.findFirst({
          where: { date: { lt: executionDate }, createdById: recurring.createdById },
          orderBy: { date: 'desc' },
        });

        const opening = prevEntry ? Number(prevEntry.closingCash) : 0;

        const createData = {
          date: executionDate,
          openingCash: opening,
          cashSales: mode === 'CASH' ? amt : 0,
          upiReceipts: mode === 'UPI' ? amt : 0,
          cardReceipts: mode === 'CARD' ? amt : 0,
          otherIncome: mode !== 'CASH' && mode !== 'UPI' && mode !== 'CARD' ? amt : 0,
          totalExpenses: 0,
          bankDeposit: 0,
          closingCash: mode === 'CASH' ? opening + amt : opening,
          cashDifference: 0,
          notes: `Auto-created from recurring income: ${recurring.title}`,
          createdById: recurring.createdById,
        };

        const created = await prisma.cashBook.create({
          data: createData,
        });

        if (mode === 'UPI') {
          await cashBookService._syncUpiToBank(created);
        }
      }
    }

    await prisma.notification.create({
      data: {
        userId: recurring.createdById,
        title: `Executed: ${recurring.title}`,
        message: `Recurring ${recurring.type.toLowerCase()} of ₹${Number(recurring.amount).toLocaleString('en-IN')} was processed for ${executionDate.toLocaleDateString('en-IN')}.`,
        type: 'INFO',
        link: '/recurring',
      },
    });
  }

  async runSchedules() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dueSchedules = await recurringRepository.findDueRecurrings(today);
    let processedCount = 0;

    for (const schedule of dueSchedules) {
      let currentDue = new Date(schedule.nextDueDate);
      let isStillActive = schedule.isActive;

      while (currentDue <= today && isStillActive) {
        await this.executeOccurrence(schedule, currentDue);
        processedCount++;

        const nextDue = this.calculateNextDueDate(currentDue, schedule.frequency, schedule.customDays);

        if (schedule.endDate && nextDue > new Date(schedule.endDate)) {
          isStillActive = false;
          currentDue = nextDue;
          break;
        }

        currentDue = nextDue;
      }

      await recurringRepository.updateRecurring(schedule.id, {
        nextDueDate: currentDue,
        isActive: isStillActive,
      });
    }

    return { processedCount };
  }

  async processManualOccurrence(id, userId) {
    const schedule = await recurringRepository.findRecurringById(id);
    if (!schedule) throw new ApiError(404, 'Recurring transaction schedule not found.');
    if (schedule.createdById && schedule.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to execute this schedule.');
    }
    if (!schedule.isActive) throw new ApiError(400, 'Schedule is inactive.');

    // Execute exactly one occurrence for the current nextDueDate
    await this.executeOccurrence(schedule, schedule.nextDueDate);

    // Increment nextDueDate
    const nextDue = this.calculateNextDueDate(schedule.nextDueDate, schedule.frequency, schedule.customDays);
    let isStillActive = schedule.isActive;

    if (schedule.endDate && nextDue > new Date(schedule.endDate)) {
      isStillActive = false;
    }

    const updated = await recurringRepository.updateRecurring(schedule.id, {
      nextDueDate: nextDue,
      isActive: isStillActive,
    });

    return { success: true, nextDueDate: updated.nextDueDate, isActive: updated.isActive };
  }

  async postponeReminder(id, userId) {
    const schedule = await recurringRepository.findRecurringById(id);
    if (!schedule) throw new ApiError(404, 'Recurring transaction schedule not found.');
    if (schedule.createdById && schedule.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to modify this schedule.');
    }

    // Set nextDueDate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const updated = await recurringRepository.updateRecurring(schedule.id, {
      nextDueDate: tomorrow,
    });

    return { success: true, message: 'Reminder postponed to tomorrow!', nextDueDate: updated.nextDueDate };
  }

  async getRecurringStats(userId) {
    return recurringRepository.getRecurringStats(userId);
  }
}

module.exports = new RecurringService();
