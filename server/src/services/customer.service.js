const customerRepository = require('../repositories/customer.repository');
const broadcastService = require('./broadcast.service');
const ApiError = require('../utils/ApiError');

class CustomerService {
  // ─── Customer Services ──────────────────────────────────────────────────────

  async createCustomer(data, userId) {
    const existing = await customerRepository.findCustomerByName(data.name, userId);
    if (existing) {
      throw new ApiError(400, `Customer with name '${data.name}' already exists.`);
    }
    return customerRepository.createCustomer({ ...data, createdById: userId });
  }

  async getCustomers(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { name: 'asc' };

    const { customers, total } = await customerRepository.findCustomers({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCustomer(id, data, userId) {
    const existing = await customerRepository.findCustomerById(id);
    if (!existing) {
      throw new ApiError(404, 'Customer not found.');
    }
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to update this customer.');
    }

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const nameConflict = await customerRepository.findCustomerByName(data.name, userId);
      if (nameConflict) {
        throw new ApiError(400, `Customer with name '${data.name}' already exists.`);
      }
    }

    return customerRepository.updateCustomer(id, data);
  }

  async deleteCustomer(id, userId) {
    const existing = await customerRepository.findCustomerById(id);
    if (!existing) {
      throw new ApiError(404, 'Customer not found.');
    }
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this customer.');
    }

    try {
      return await customerRepository.deleteCustomer(id);
    } catch (err) {
      throw new ApiError(400, 'Cannot delete customer. There are credit or collection logs under this customer.');
    }
  }

  // ─── Customer Credit Services ────────────────────────────────────────────────

  async createCredit(data, userId) {
    const customer = await customerRepository.findCustomerById(data.customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found.');
    }

    const amount = parseFloat(data.amount);
    const payload = {
      customerId: data.customerId,
      date: new Date(data.date),
      description: data.description,
      amount,
      paidAmount: 0,
      status: 'PENDING',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      createdById: userId,
    };

    return customerRepository.createCredit(payload);
  }

  async getCredits(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.description = { contains: query.search, mode: 'insensitive' };
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { date: 'desc' };

    const { credits, total } = await customerRepository.findCredits({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      credits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteCredit(id, userId) {
    const existing = await customerRepository.findCreditById(id);
    if (!existing) {
      throw new ApiError(404, 'Credit entry not found.');
    }
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this credit entry.');
    }

    try {
      return await customerRepository.deleteCredit(id);
    } catch (err) {
      throw new ApiError(400, 'Cannot delete credit. There are collections recorded against this credit.');
    }
  }

  // ─── Credit Collection Services ──────────────────────────────────────────────

  async createCollection(data, userId) {
    const customer = await customerRepository.findCustomerById(data.customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found.');
    }

    if (data.customerCreditId) {
      const credit = await customerRepository.findCreditById(data.customerCreditId);
      if (!credit) {
        throw new ApiError(404, 'Credit entry not found.');
      }
      if (credit.customerId !== data.customerId) {
        throw new ApiError(400, 'The specified credit does not belong to this customer.');
      }
    }

    const amount = parseFloat(data.amount);
    const payload = {
      customerId: data.customerId,
      customerCreditId: data.customerCreditId || null,
      collectionDate: new Date(data.collectionDate),
      amount,
      paymentMode: data.paymentMode || 'CASH',
      referenceNo: data.referenceNo || null,
      notes: data.notes || null,
      createdById: userId,
    };

    const collection = await customerRepository.createCollection(payload);

    // Recalculate credit statuses for this customer
    await this._recalcCustomerCredits(data.customerId);

    // Auto-sync customer collection into CashBook
    await this._syncCollectionToCashBook(collection, customer.name);

    // Broadcast transaction
    broadcastService.broadcastTransaction({
      userId,
      type: 'CUSTOMER_COLLECTION',
      amount: collection.amount,
      partyName: customer.name,
      description: collection.notes || `Customer Collection: ${customer.name}`,
      paymentMode: collection.paymentMode,
      date: collection.collectionDate,
    });

    return collection;
  }

  async getCollections(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.customerCreditId) where.customerCreditId = query.customerCreditId;
    if (query.paymentMode) where.paymentMode = query.paymentMode;

    if (query.startDate || query.endDate) {
      where.collectionDate = {};
      if (query.startDate) where.collectionDate.gte = new Date(query.startDate);
      if (query.endDate) where.collectionDate.lte = new Date(query.endDate);
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { collectionDate: 'desc' };

    const { collections, total } = await customerRepository.findCollections({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      collections,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteCollection(id, userId) {
    const collection = await customerRepository.findCollectionById(id);
    if (!collection) {
      throw new ApiError(404, 'Collection receipt not found.');
    }
    if (collection.createdById && collection.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this collection receipt.');
    }

    const customerId = collection.customerId;
    await customerRepository.deleteCollection(id);

    // Clean up CashBook sync
    await this._cleanupCollectionFromCashBook(collection);

    if (customerId) {
      await this._recalcCustomerCredits(customerId);
    }

    return { message: 'Collection receipt deleted successfully.' };
  }

  // ─── Ledger & Stats ──────────────────────────────────────────────────────────

  async getCustomerLedger(customerId, userId) {
    const customer = await customerRepository.findCustomerById(customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found.');
    }
    if (customer.createdById && customer.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to view this customer\'s ledger.');
    }

    const { credits, collections } = await customerRepository.getCustomerLedger(customerId);

    const ledger = [];

    for (const credit of credits) {
      ledger.push({
        type: 'credit',
        date: credit.date,
        id: credit.id,
        description: credit.description,
        debit: Number(credit.amount),
        credit: 0,
        status: credit.status,
        details: credit,
      });
    }

    for (const coll of collections) {
      ledger.push({
        type: 'collection',
        date: coll.collectionDate,
        id: coll.id,
        description: `Collection received via ${coll.paymentMode}${coll.referenceNo ? ` (Ref: ${coll.referenceNo})` : ''}`,
        debit: 0,
        credit: Number(coll.amount),
        status: null,
        details: coll,
      });
    }

    // Sort by date descending
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalCollected = collections.reduce((sum, coll) => sum + Number(coll.amount), 0);
    const outstanding = totalCredit - totalCollected;

    return {
      customer,
      ledger,
      summary: {
        totalCredit,
        totalCollected,
        outstanding,
        creditCount: credits.length,
        collectionCount: collections.length,
      },
    };
  }

  async getCustomerStats(userId) {
    return customerRepository.getCustomerStats(userId);
  }

  // ─── Helper Recalculation ───────────────────────────────────────────────────

  async _recalcCustomerCredits(customerId) {
    if (!customerId) return;
    const prisma = require('../config/prisma');

    const credits = await prisma.customerCredit.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
    });

    if (credits.length === 0) return;

    const collections = await prisma.creditCollection.findMany({
      where: { customerId },
    });

    const explicitMap = {};
    let unlinkedPool = 0;

    for (const c of collections) {
      const amt = Number(c.amount);
      if (c.customerCreditId) {
        explicitMap[c.customerCreditId] = (explicitMap[c.customerCreditId] || 0) + amt;
      } else {
        unlinkedPool += amt;
      }
    }

    for (const credit of credits) {
      const totalAmt = Number(credit.amount);
      const explicitPaid = explicitMap[credit.id] || 0;

      let creditPaid = explicitPaid;
      const needed = Math.max(0, totalAmt - explicitPaid);

      if (needed > 0 && unlinkedPool > 0) {
        const alloc = Math.min(unlinkedPool, needed);
        creditPaid += alloc;
        unlinkedPool -= alloc;
      }

      let status = 'PENDING';
      if (creditPaid >= totalAmt) status = 'PAID';
      else if (creditPaid > 0) status = 'PARTIAL';

      await prisma.customerCredit.update({
        where: { id: credit.id },
        data: { paidAmount: creditPaid, status },
      });
    }
  }

  async _syncCollectionToCashBook(collection, customerName) {
    const prisma = require('../config/prisma');
    const collectionDate = new Date(collection.collectionDate);
    const startOfDay = new Date(collectionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(collectionDate);
    endOfDay.setHours(23, 59, 59, 999);

    let cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: collection.createdById,
      },
    });

    const amt = Number(collection.amount);
    const mode = collection.paymentMode || 'CASH';

    if (cashBook) {
      const field = mode === 'UPI' ? 'upiReceipts' : mode === 'CARD' ? 'cardReceipts' : 'cashSales';
      const newReceipts = Number(cashBook[field]) + amt;

      const newSales = mode === 'UPI' || mode === 'CARD' ? Number(cashBook.cashSales) : (field === 'cashSales' ? newReceipts : Number(cashBook.cashSales));
      const newUpi = mode === 'UPI' ? newReceipts : Number(cashBook.upiReceipts);
      const newCard = mode === 'CARD' ? newReceipts : Number(cashBook.cardReceipts);

      const expectedClosing = Number(cashBook.openingCash) + newSales + newUpi + newCard + Number(cashBook.otherIncome) - Number(cashBook.totalExpenses) - Number(cashBook.bankDeposit);
      const newDifference = Number(cashBook.closingCash) - expectedClosing;

      const updateData = { cashDifference: newDifference };
      updateData[field] = newReceipts;

      const updated = await prisma.cashBook.update({
        where: { id: cashBook.id },
        data: updateData,
      });

      const cashBookService = require('./cashbook.service');
      await cashBookService._syncUpiToBank(updated);
    } else {
      const created = await prisma.cashBook.create({
        data: {
          date: startOfDay,
          openingCash: 0,
          cashSales: mode === 'CASH' ? amt : 0,
          upiReceipts: mode === 'UPI' ? amt : 0,
          cardReceipts: mode === 'CARD' ? amt : 0,
          otherIncome: mode !== 'CASH' && mode !== 'UPI' && mode !== 'CARD' ? amt : 0,
          totalExpenses: 0,
          bankDeposit: 0,
          closingCash: mode === 'CASH' ? amt : 0,
          cashDifference: 0,
          notes: `Auto-created from customer collection receipt (${customerName || 'Customer'})`,
          createdById: collection.createdById,
        },
      });

      if (mode === 'UPI' && amt > 0) {
        const cashBookService = require('./cashbook.service');
        await cashBookService._syncUpiToBank(created);
      }
    }
  }

  async _cleanupCollectionFromCashBook(collection) {
    if (!collection) return;
    const prisma = require('../config/prisma');
    const collectionDate = new Date(collection.collectionDate);
    const startOfDay = new Date(collectionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(collectionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: collection.createdById,
      },
    });

    if (cashBook) {
      const amt = Number(collection.amount);
      const mode = collection.paymentMode || 'CASH';
      const field = mode === 'UPI' ? 'upiReceipts' : mode === 'CARD' ? 'cardReceipts' : 'cashSales';
      const newReceipts = Math.max(0, Number(cashBook[field]) - amt);

      const updateData = {};
      updateData[field] = newReceipts;

      const updated = await prisma.cashBook.update({
        where: { id: cashBook.id },
        data: updateData,
      });

      const cashBookService = require('./cashbook.service');
      await cashBookService._syncUpiToBank(updated);
    }
  }
}

module.exports = new CustomerService();
