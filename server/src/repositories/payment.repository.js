// src/repositories/payment.repository.js
const prisma = require('../config/prisma');

class PaymentRepository {
  // ─── Distributor Payments ────────────────────────────────────────────────────

  async createPayment(data) {
    return prisma.distributorPayment.create({ data, include: { distributor: true, bill: true } });
  }

  async findPayments({ skip, take, where, orderBy }) {
    const [payments, total] = await Promise.all([
      prisma.distributorPayment.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          distributor: { select: { id: true, name: true } },
          bill: { select: { id: true, invoiceNo: true, grandTotal: true } },
        },
      }),
      prisma.distributorPayment.count({ where }),
    ]);
    return { payments, total };
  }

  async findPaymentById(id) {
    return prisma.distributorPayment.findUnique({
      where: { id },
      include: { distributor: true, bill: true },
    });
  }

  async deletePayment(id) {
    return prisma.distributorPayment.delete({ where: { id } });
  }

  async getDistributorLedger(distributorId) {
    const [distributor, bills, payments] = await Promise.all([
      prisma.distributor.findUnique({ where: { id: distributorId } }),
      prisma.purchaseBill.findMany({
        where: { distributorId },
        orderBy: { billDate: 'desc' },
        select: {
          id: true,
          invoiceNo: true,
          billDate: true,
          dueDate: true,
          grandTotal: true,
          paidAmount: true,
          status: true,
          gstAmount: true,
          discountAmount: true,
          subtotal: true,
        },
      }),
      prisma.distributorPayment.findMany({
        where: { distributorId },
        orderBy: { paymentDate: 'desc' },
        select: {
          id: true,
          paymentDate: true,
          amount: true,
          paymentMode: true,
          referenceNo: true,
          billId: true,
          notes: true,
        },
      }),
    ]);

    return { distributor, bills, payments };
  }

  async getPaymentStats(userId) {
    const totalWhere = {};
    if (userId) totalWhere.createdById = userId;

    // Total paid to distributors (all time)
    const totalPaid = await prisma.distributorPayment.aggregate({
      where: totalWhere,
      _sum: { amount: true },
    });

    // Paid this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthWhere = { paymentDate: { gte: monthStart, lte: monthEnd } };
    if (userId) monthWhere.createdById = userId;

    const monthPaid = await prisma.distributorPayment.aggregate({
      where: monthWhere,
      _sum: { amount: true },
    });

    // Outstanding dues (bills not fully paid)
    const outstandingWhere = { status: { in: ['PENDING', 'PARTIAL'] } };
    if (userId) outstandingWhere.createdById = userId;

    const outstanding = await prisma.purchaseBill.aggregate({
      where: outstandingWhere,
      _sum: { grandTotal: true, paidAmount: true },
    });

    const outstandingDues =
      Number(outstanding._sum.grandTotal || 0) - Number(outstanding._sum.paidAmount || 0);

    return {
      totalPaidAllTime: Number(totalPaid._sum.amount || 0),
      paidThisMonth: Number(monthPaid._sum.amount || 0),
      outstandingDues,
    };
  }
}

module.exports = new PaymentRepository();
