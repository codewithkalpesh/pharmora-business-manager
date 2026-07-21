const prisma = require('../config/prisma');

class RecurringRepository {
  async createRecurring(data) {
    return prisma.recurringTransaction.create({ data });
  }

  async findRecurrings(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [recurrings, total] = await Promise.all([
      prisma.recurringTransaction.findMany({
        skip,
        take,
        where,
        orderBy,
      }),
      prisma.recurringTransaction.count({ where }),
    ]);

    return { recurrings, total };
  }

  async findRecurringById(id) {
    return prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateRecurring(id, data) {
    return prisma.recurringTransaction.update({
      where: { id },
      data,
    });
  }

  async deleteRecurring(id) {
    return prisma.recurringTransaction.delete({
      where: { id },
    });
  }

  async findDueRecurrings(nowDate) {
    return prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDueDate: { lte: nowDate },
      },
    });
  }

  async getRecurringStats(userId) {
    const where = { isActive: true };
    if (userId) where.createdById = userId;

    const activeCount = await prisma.recurringTransaction.count({
      where,
    });

    const activeRecurrings = await prisma.recurringTransaction.findMany({
      where,
      select: { amount: true, type: true, frequency: true },
    });

    // Approximate monthly recurring total (normalizing daily/weekly/etc. to monthly equivalents)
    let projectedMonthlyExpense = 0;
    let projectedMonthlyIncome = 0;

    activeRecurrings.forEach((r) => {
      const amt = Number(r.amount);
      let factor = 0;

      if (r.frequency === 'DAILY') factor = 30;
      else if (r.frequency === 'WEEKLY') factor = 4.33;
      else if (r.frequency === 'MONTHLY') factor = 1;
      else if (r.frequency === 'QUARTERLY') factor = 1 / 3;
      else if (r.frequency === 'HALF_YEARLY') factor = 1 / 6;
      else if (r.frequency === 'YEARLY') factor = 1 / 12;
      else factor = 1; // Default/custom estimate

      if (r.type === 'EXPENSE') {
        projectedMonthlyExpense += amt * factor;
      } else {
        projectedMonthlyIncome += amt * factor;
      }
    });

    return {
      activeCount,
      projectedMonthlyExpense,
      projectedMonthlyIncome,
    };
  }
}

module.exports = new RecurringRepository();
