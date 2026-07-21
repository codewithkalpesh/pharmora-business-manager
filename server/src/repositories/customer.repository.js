const prisma = require('../config/prisma');

class CustomerRepository {
  // ─── Customer CRUD ──────────────────────────────────────────────────────────

  async createCustomer(data) {
    return prisma.customer.create({ data });
  }

  async findCustomers(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          credits: {
            select: { amount: true },
          },
          collections: {
            select: { amount: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const processedCustomers = customers.map((c) => {
      const totalCredit = c.credits.reduce((sum, credit) => sum + Number(credit.amount), 0);
      const totalCollected = c.collections.reduce((sum, coll) => sum + Number(coll.amount), 0);
      const outstanding = Math.max(0, totalCredit - totalCollected);

      const { credits, collections, ...rest } = c;
      return {
        ...rest,
        outstandingCredit: outstanding,
      };
    });

    return { customers: processedCustomers, total };
  }

  async findCustomerById(id) {
    return prisma.customer.findUnique({
      where: { id },
    });
  }

  async findCustomerByName(name, userId) {
    const where = { name: { equals: name, mode: 'insensitive' } };
    if (userId) where.createdById = userId;
    return prisma.customer.findFirst({ where });
  }

  async updateCustomer(id, data) {
    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  async deleteCustomer(id) {
    return prisma.customer.delete({
      where: { id },
    });
  }

  // ─── Customer Credit CRUD ───────────────────────────────────────────────────

  async createCredit(data) {
    return prisma.customerCredit.create({
      data,
      include: { customer: true },
    });
  }

  async findCredits(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [credits, total] = await Promise.all([
      prisma.customerCredit.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.customerCredit.count({ where }),
    ]);

    return { credits, total };
  }

  async findCreditById(id) {
    return prisma.customerCredit.findUnique({
      where: { id },
      include: { customer: true },
    });
  }

  async updateCredit(id, data) {
    return prisma.customerCredit.update({
      where: { id },
      data,
      include: { customer: true },
    });
  }

  async deleteCredit(id) {
    return prisma.customerCredit.delete({
      where: { id },
    });
  }

  // ─── Credit Collection CRUD ─────────────────────────────────────────────────

  async createCollection(data) {
    return prisma.creditCollection.create({
      data,
      include: { customer: true, customerCredit: true },
    });
  }

  async findCollections(params = {}) {
    const { skip, take, where, orderBy } = params;

    const [collections, total] = await Promise.all([
      prisma.creditCollection.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          customer: {
            select: { id: true, name: true },
          },
          customerCredit: {
            select: { id: true, description: true },
          },
        },
      }),
      prisma.creditCollection.count({ where }),
    ]);

    return { collections, total };
  }

  async findCollectionById(id) {
    return prisma.creditCollection.findUnique({
      where: { id },
      include: { customer: true, customerCredit: true },
    });
  }

  async deleteCollection(id) {
    return prisma.creditCollection.delete({
      where: { id },
    });
  }

  // ─── Ledger & Stats ──────────────────────────────────────────────────────────

  async getCustomerLedger(customerId) {
    const [customer, credits, collections] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.customerCredit.findMany({
        where: { customerId },
        orderBy: { date: 'desc' },
      }),
      prisma.creditCollection.findMany({
        where: { customerId },
        orderBy: { collectionDate: 'desc' },
      }),
    ]);

    return { customer, credits, collections };
  }

  async getCustomerStats(userId) {
    const overallWhere = {};
    if (userId) overallWhere.createdById = userId;

    // Total credits logged (overall)
    const overallCredit = await prisma.customerCredit.aggregate({
      where: overallWhere,
      _sum: { amount: true, paidAmount: true },
    });

    const totalOutstanding = 
      Number(overallCredit._sum.amount || 0) - Number(overallCredit._sum.paidAmount || 0);

    // Collected this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthWhere = {
      collectionDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };
    if (userId) monthWhere.createdById = userId;

    const monthCollections = await prisma.creditCollection.aggregate({
      where: monthWhere,
      _sum: { amount: true },
    });

    // Overdue count & amount
    const overdueWhere = {
      status: { in: ['PENDING', 'PARTIAL'] },
      dueDate: {
        lt: new Date(),
      },
    };
    if (userId) overdueWhere.createdById = userId;

    const overdueStats = await prisma.customerCredit.aggregate({
      where: overdueWhere,
      _sum: { amount: true, paidAmount: true },
      _count: { id: true },
    });

    const overdueAmount =
      Number(overdueStats._sum.amount || 0) - Number(overdueStats._sum.paidAmount || 0);

    return {
      outstandingCredit: totalOutstanding,
      monthCollections: Number(monthCollections._sum.amount || 0),
      overdueAmount,
      overdueCount: overdueStats._count.id || 0,
    };
  }
}

module.exports = new CustomerRepository();
