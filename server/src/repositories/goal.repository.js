const prisma = require('../config/prisma');

class GoalRepository {
  async createGoal(data) {
    return prisma.paymentGoal.create({
      data,
      include: {
        distributor: { select: { id: true, name: true } },
        bill: { select: { id: true, invoiceNo: true, grandTotal: true, paidAmount: true } },
        expenseCategory: { select: { id: true, name: true } },
        borrowedMoney: { select: { id: true, personName: true, targetAmount: true, paidAmount: true } },
        contributions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findGoals(params = {}) {
    const { skip, take, where, orderBy } = params;
    const [goals, total] = await Promise.all([
      prisma.paymentGoal.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          distributor: { select: { id: true, name: true } },
          bill: { select: { id: true, invoiceNo: true, grandTotal: true, paidAmount: true } },
          expenseCategory: { select: { id: true, name: true } },
          borrowedMoney: { select: { id: true, personName: true, targetAmount: true, paidAmount: true } },
          contributions: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.paymentGoal.count({ where }),
    ]);

    return { goals, total };
  }

  async findGoalById(id) {
    return prisma.paymentGoal.findUnique({
      where: { id },
      include: {
        distributor: { select: { id: true, name: true } },
        bill: { select: { id: true, invoiceNo: true, grandTotal: true, paidAmount: true } },
        expenseCategory: { select: { id: true, name: true } },
        borrowedMoney: { select: { id: true, personName: true, targetAmount: true, paidAmount: true } },
        contributions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async updateGoal(id, data) {
    return prisma.paymentGoal.update({
      where: { id },
      data,
      include: {
        distributor: { select: { id: true, name: true } },
        bill: { select: { id: true, invoiceNo: true, grandTotal: true, paidAmount: true } },
        expenseCategory: { select: { id: true, name: true } },
        borrowedMoney: { select: { id: true, personName: true, targetAmount: true, paidAmount: true } },
        contributions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async deleteGoal(id) {
    return prisma.paymentGoal.delete({
      where: { id },
    });
  }

  async addContribution(data) {
    return prisma.$transaction(async (tx) => {
      const contribution = await tx.goalContribution.create({
        data,
      });

      const goal = await tx.paymentGoal.findUnique({
        where: { id: data.goalId },
      });

      const newSavedAmount = Number(goal.savedAmount) + Number(data.amount);
      const isCompleted = newSavedAmount >= Number(goal.targetAmount);

      const updatedGoal = await tx.paymentGoal.update({
        where: { id: data.goalId },
        data: {
          savedAmount: newSavedAmount,
          status: isCompleted ? 'COMPLETED' : goal.status,
        },
        include: {
          distributor: { select: { id: true, name: true } },
          bill: { select: { id: true, invoiceNo: true, grandTotal: true, paidAmount: true } },
          expenseCategory: { select: { id: true, name: true } },
          borrowedMoney: { select: { id: true, personName: true, targetAmount: true, paidAmount: true } },
          contributions: { orderBy: { createdAt: 'desc' } },
        },
      });

      return { contribution, goal: updatedGoal };
    });
  }

  async getGoalStats(createdById) {
    const goals = await prisma.paymentGoal.findMany({
      where: { createdById },
    });

    const activeGoals = goals.filter((g) => g.status === 'IN_PROGRESS');
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED');

    const totalTarget = activeGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + Number(g.savedAmount), 0);

    return {
      totalGoals: goals.length,
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      totalTarget,
      totalSaved,
    };
  }
}

module.exports = new GoalRepository();
