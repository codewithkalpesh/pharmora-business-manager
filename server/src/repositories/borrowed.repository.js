// src/repositories/borrowed.repository.js
const prisma = require('../config/prisma');

class BorrowedRepository {
  async create(data) {
    return prisma.borrowedMoney.create({
      data,
      include: {
        repayments: {
          orderBy: { repaymentDate: 'desc' },
        },
      },
    });
  }

  async findAll(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [items, total] = await Promise.all([
      prisma.borrowedMoney.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          repayments: {
            orderBy: { repaymentDate: 'desc' },
          },
        },
      }),
      prisma.borrowedMoney.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id) {
    return prisma.borrowedMoney.findUnique({
      where: { id },
      include: {
        repayments: {
          orderBy: { repaymentDate: 'desc' },
        },
      },
    });
  }

  async update(id, data) {
    return prisma.borrowedMoney.update({
      where: { id },
      data,
      include: {
        repayments: {
          orderBy: { repaymentDate: 'desc' },
        },
      },
    });
  }

  async delete(id) {
    return prisma.borrowedMoney.delete({
      where: { id },
    });
  }

  // ─── Repayments CRUD ──────────────────────────────────────────────────────────

  async createRepayment(data) {
    return prisma.borrowedRepayment.create({
      data,
      include: {
        borrowedMoney: true,
      },
    });
  }

  async findRepaymentById(id) {
    return prisma.borrowedRepayment.findUnique({
      where: { id },
      include: {
        borrowedMoney: true,
      },
    });
  }

  async deleteRepayment(id) {
    return prisma.borrowedRepayment.delete({
      where: { id },
    });
  }

  // ─── Summary / Analytics Metrics ─────────────────────────────────────────────

  async getSummary(userId) {
    const [borrowedAgg, repaymentsAgg, pendingCount, overdueCount] = await Promise.all([
      prisma.borrowedMoney.aggregate({
        where: { createdById: userId },
        _sum: { borrowedAmount: true, targetAmount: true, paidAmount: true },
      }),
      prisma.borrowedRepayment.aggregate({
        where: { createdById: userId },
        _sum: { amount: true },
      }),
      prisma.borrowedMoney.count({
        where: { createdById: userId, status: { in: ['PENDING', 'PARTIAL'] } },
      }),
      prisma.borrowedMoney.count({
        where: {
          createdById: userId,
          status: { in: ['PENDING', 'PARTIAL'] },
          targetDate: { lt: new Date() },
        },
      }),
    ]);

    const totalBorrowed = Number(borrowedAgg._sum.borrowedAmount || 0);
    const totalTarget = Number(borrowedAgg._sum.targetAmount || 0);
    const totalPaid = Number(borrowedAgg._sum.paidAmount || 0);
    const totalRemaining = Math.max(0, totalTarget - totalPaid);

    return {
      totalBorrowed,
      totalTarget,
      totalPaid,
      totalRemaining,
      pendingCount,
      overdueCount,
    };
  }
}

module.exports = new BorrowedRepository();
