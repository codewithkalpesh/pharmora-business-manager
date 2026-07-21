// src/repositories/purchase.repository.js
const prisma = require('../config/prisma');

class PurchaseRepository {
  // Distributor CRUD
  async createDistributor(data) {
    return prisma.distributor.create({ data });
  }

  async findDistributors(params = {}) {
    const { skip, take, where, orderBy } = params;
    
    const [distributors, total] = await Promise.all([
      prisma.distributor.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          purchaseBills: {
            select: {
              grandTotal: true,
            },
          },
          payments: {
            select: {
              amount: true,
            },
          },
        },
      }),
      prisma.distributor.count({ where }),
    ]);

    const processedDistributors = distributors.map((d) => {
      const totalBilled = d.purchaseBills.reduce(
        (sum, bill) => sum + Number(bill.grandTotal),
        0
      );
      const totalPaid = d.payments.reduce(
        (sum, pay) => sum + Number(pay.amount),
        0
      );
      const outstanding = Math.max(0, totalBilled - totalPaid);

      const { purchaseBills, payments, ...rest } = d;
      return {
        ...rest,
        outstandingDues: outstanding,
      };
    });

    return { distributors: processedDistributors, total };
  }

  async findDistributorById(id) {
    return prisma.distributor.findUnique({
      where: { id },
    });
  }

  async findDistributorByName(name, createdById) {
    const where = { name: { equals: name, mode: 'insensitive' } };
    if (createdById) where.createdById = createdById;
    return prisma.distributor.findFirst({ where });
  }

  async updateDistributor(id, data) {
    return prisma.distributor.update({
      where: { id },
      data,
    });
  }

  async deleteDistributor(id) {
    return prisma.distributor.delete({
      where: { id },
    });
  }

  // Purchase Bill CRUD
  async createBill(data) {
    return prisma.purchaseBill.create({
      data,
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findBills(params = {}) {
    const { skip, take, where, orderBy } = params;
    const [bills, total] = await Promise.all([
      prisma.purchaseBill.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          supplier: { select: { id: true, name: true } },
        },
      }),
      prisma.purchaseBill.count({ where }),
    ]);
    return { bills, total };
  }

  async findBillById(id) {
    return prisma.purchaseBill.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async findBillByInvoice(invoiceNo, distributorId) {
    return prisma.purchaseBill.findUnique({
      where: {
        invoiceNo_distributorId: {
          invoiceNo,
          distributorId,
        },
      },
    });
  }

  async updateBill(id, data) {
    return prisma.purchaseBill.update({
      where: { id },
      data,
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async deleteBill(id) {
    return prisma.purchaseBill.delete({
      where: { id },
    });
  }

  // Purchases stats aggregate
  async aggregatePurchaseStats(whereClause = {}) {
    const stats = await prisma.purchaseBill.aggregate({
      where: whereClause,
      _sum: {
        grandTotal: true,
        paidAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const outstanding = Number(stats._sum.grandTotal || 0) - Number(stats._sum.paidAmount || 0);

    return {
      totalPurchases: Number(stats._sum.grandTotal || 0),
      totalPaid: Number(stats._sum.paidAmount || 0),
      outstandingDues: outstanding,
      billsCount: stats._count.id,
    };
  }
}

module.exports = new PurchaseRepository();
