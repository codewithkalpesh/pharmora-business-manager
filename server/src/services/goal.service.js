const goalRepository = require('../repositories/goal.repository');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class GoalService {
  async createGoal(data, userId) {
    let title = data.title;

    // Auto-generate titles if user didn't specify a detailed custom title
    if (data.category === 'PURCHASE' && data.distributorId) {
      const dist = await prisma.distributor.findUnique({ where: { id: data.distributorId } });
      if (dist && (!title || title.trim() === '')) {
        title = `Pay Distributor: ${dist.name}`;
      }
      if (data.billId) {
        const bill = await prisma.purchaseBill.findUnique({ where: { id: data.billId } });
        if (bill && bill.invoiceNo) {
          title += ` (Inv #${bill.invoiceNo})`;
        }
      }
    } else if (data.category === 'EXPENSE' && data.expenseCategoryId) {
      const cat = await prisma.expenseCategory.findUnique({ where: { id: data.expenseCategoryId } });
      if (cat && (!title || title.trim() === '')) {
        title = `Expense Fund: ${cat.name}`;
      }
    } else if (data.category === 'BORROWED_MONEY' && data.borrowedMoneyId) {
      const borrowed = await prisma.borrowedMoney.findUnique({ where: { id: data.borrowedMoneyId } });
      if (borrowed && (!title || title.trim() === '')) {
        title = `Repay Borrowed: ${borrowed.personName}`;
      }
    }

    if (!title || title.trim() === '') {
      title = 'New Financial Goal';
    }

    const payload = {
      title,
      description: data.description || null,
      category: data.category || 'GENERAL',
      targetAmount: parseFloat(data.targetAmount),
      targetDate: new Date(data.targetDate),
      distributorId: data.distributorId || null,
      billId: data.billId || null,
      expenseCategoryId: data.expenseCategoryId || null,
      borrowedMoneyId: data.borrowedMoneyId || null,
      createdById: userId,
    };

    return goalRepository.createGoal(payload);
  }

  async getGoals(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const where = { createdById: userId };

    if (query.category) {
      where.category = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = [
      { status: 'asc' },
      { targetDate: 'asc' },
      { createdAt: 'desc' },
    ];

    const { goals, total } = await goalRepository.findGoals({
      skip,
      take: limit,
      where,
      orderBy,
    });

    const stats = await goalRepository.getGoalStats(userId);

    return {
      goals,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGoalById(id, userId) {
    const goal = await goalRepository.findGoalById(id);
    if (!goal) throw new ApiError(404, 'Goal not found.');
    if (goal.createdById !== userId) throw new ApiError(403, 'Unauthorized access to this goal.');
    return goal;
  }

  async updateGoal(id, data, userId) {
    const existing = await goalRepository.findGoalById(id);
    if (!existing) throw new ApiError(404, 'Goal not found.');
    if (existing.createdById !== userId) throw new ApiError(403, 'Unauthorized access to this goal.');

    const payload = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.category !== undefined) payload.category = data.category;
    if (data.targetAmount !== undefined) payload.targetAmount = parseFloat(data.targetAmount);
    if (data.targetDate !== undefined) payload.targetDate = new Date(data.targetDate);
    if (data.status !== undefined) payload.status = data.status;

    return goalRepository.updateGoal(id, payload);
  }

  async deleteGoal(id, userId) {
    const existing = await goalRepository.findGoalById(id);
    if (!existing) throw new ApiError(404, 'Goal not found.');
    if (existing.createdById !== userId) throw new ApiError(403, 'Unauthorized access to this goal.');

    return goalRepository.deleteGoal(id);
  }

  async addContribution(goalId, data, userId) {
    const goal = await goalRepository.findGoalById(goalId);
    if (!goal) throw new ApiError(404, 'Goal not found.');
    if (goal.createdById !== userId) throw new ApiError(403, 'Unauthorized access to this goal.');

    const payload = {
      goalId,
      amount: parseFloat(data.amount),
      notes: data.notes || null,
      date: data.date ? new Date(data.date) : new Date(),
      createdById: userId,
    };

    return goalRepository.addContribution(payload);
  }

  /**
   * Helper endpoint to fetch distributors with pending bills, expense categories, and borrowed money list
   * to sync dropdown choices when creating goals.
   */
  async getSyncData(userId) {
    const [distributors, expenseCategories, borrowedList] = await Promise.all([
      prisma.distributor.findMany({
        where: { createdById: userId, isActive: true },
        select: {
          id: true,
          name: true,
          purchaseBills: {
            where: { status: { in: ['PENDING', 'PARTIAL'] } },
            select: {
              id: true,
              invoiceNo: true,
              grandTotal: true,
              paidAmount: true,
              dueDate: true,
            },
          },
          payments: { select: { amount: true } },
        },
      }),
      prisma.expenseCategory.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.borrowedMoney.findMany({
        where: { createdById: userId, status: { in: ['PENDING', 'PARTIAL'] } },
        select: {
          id: true,
          personName: true,
          borrowedAmount: true,
          targetAmount: true,
          paidAmount: true,
          targetDate: true,
        },
      }),
    ]);

    const formattedDistributors = distributors.map((d) => {
      const totalBilled = d.purchaseBills.reduce((sum, b) => sum + Number(b.grandTotal), 0);
      const totalPaid = d.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingDues = Math.max(0, totalBilled - totalPaid);

      const pendingBills = d.purchaseBills.map((b) => ({
        id: b.id,
        invoiceNo: b.invoiceNo || 'N/A',
        grandTotal: Number(b.grandTotal),
        paidAmount: Number(b.paidAmount),
        balanceDue: Math.max(0, Number(b.grandTotal) - Number(b.paidAmount)),
        dueDate: b.dueDate,
      }));

      return {
        id: d.id,
        name: d.name,
        pendingDues,
        pendingBills,
      };
    });

    const formattedBorrowed = borrowedList.map((b) => {
      const balanceOwed = Math.max(0, Number(b.targetAmount) - Number(b.paidAmount));
      return {
        id: b.id,
        personName: b.personName,
        targetAmount: Number(b.targetAmount),
        paidAmount: Number(b.paidAmount),
        balanceOwed,
        targetDate: b.targetDate,
      };
    });

    return {
      distributors: formattedDistributors,
      expenseCategories,
      borrowedList: formattedBorrowed,
    };
  }

  /**
   * Daily alert helper: returns goals due within 7 days or overdue that are IN_PROGRESS.
   */
  async getDailyAlertGoals(userId) {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const goals = await prisma.paymentGoal.findMany({
      where: {
        createdById: userId,
        status: 'IN_PROGRESS',
        targetDate: {
          lte: next7Days,
        },
      },
      orderBy: { targetDate: 'asc' },
      include: {
        distributor: { select: { id: true, name: true } },
        bill: { select: { id: true, invoiceNo: true } },
        expenseCategory: { select: { id: true, name: true } },
        borrowedMoney: { select: { id: true, personName: true } },
      },
    });

    return goals;
  }
}

module.exports = new GoalService();
