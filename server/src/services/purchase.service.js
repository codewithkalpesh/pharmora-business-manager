// src/services/purchase.service.js
const purchaseRepository = require('../repositories/purchase.repository');
const ApiError = require('../utils/ApiError');

class PurchaseService {
  // Distributor Services
  async createDistributor(data, userId) {
    const existing = await purchaseRepository.findDistributorByName(data.name, userId);
    if (existing) {
      throw new ApiError(400, `Distributor with name '${data.name}' already exists.`);
    }
    return purchaseRepository.createDistributor({ ...data, createdById: userId });
  }

  async getDistributors(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = { createdById: userId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { gstNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { name: 'asc' };

    const { distributors, total } = await purchaseRepository.findDistributors({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      distributors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateDistributor(id, data, userId) {
    const existing = await purchaseRepository.findDistributorById(id);
    if (!existing) {
      throw new ApiError(404, 'Distributor not found.');
    }
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to update this distributor.');
    }

    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const nameConflict = await purchaseRepository.findDistributorByName(data.name, userId);
      if (nameConflict) {
        throw new ApiError(400, `Distributor with name '${data.name}' already exists.`);
      }
    }

    return purchaseRepository.updateDistributor(id, data);
  }

  async deleteDistributor(id, userId) {
    const existing = await purchaseRepository.findDistributorById(id);
    if (!existing) {
      throw new ApiError(404, 'Distributor not found.');
    }
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this distributor.');
    }
    try {
      return await purchaseRepository.deleteDistributor(id);
    } catch (err) {
      throw new ApiError(400, 'Cannot delete distributor. There are purchase invoices logged under this supplier.');
    }
  }

  // Purchase Bill Services
  async createBill(data, userId) {
    const existingBill = await purchaseRepository.findBillByInvoice(data.invoiceNo, data.distributorId);
    if (existingBill) {
      throw new ApiError(400, `Invoice #${data.invoiceNo} is already logged for this distributor.`);
    }

    const distributor = await purchaseRepository.findDistributorById(data.distributorId);
    if (!distributor) {
      throw new ApiError(404, 'Distributor not found.');
    }

    const subtotal = parseFloat(data.subtotal);
    const gstAmount = parseFloat(data.gstAmount || 0);
    const discountAmount = parseFloat(data.discountAmount || 0);
    const grandTotal = subtotal + gstAmount - discountAmount;
    const paidAmount = parseFloat(data.paidAmount || 0);

    let status = 'PENDING';
    if (paidAmount >= grandTotal) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIAL';

    const billDate = new Date(data.billDate);
    let dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (!dueDate) {
      dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + (distributor.creditDays || 30));
    }

    const payload = {
      invoiceNo: data.invoiceNo,
      distributorId: data.distributorId,
      billDate,
      dueDate,
      subtotal,
      gstAmount,
      discountAmount,
      grandTotal,
      paidAmount,
      status,
      notes: data.notes,
      createdById: userId,
    };
 
    const bill = await purchaseRepository.createBill(payload);
 
    if (paidAmount > 0) {
      const mode = data.paymentMode || 'CASH';
      if (mode === 'CASH') {
        await this._syncPurchaseToCashBook(bill);
      } else {
        await this._syncPurchaseToBank(bill, mode, data.bankAccountId, userId);
      }
    }
 
    return bill;
  }

  async getBills(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = { createdById: userId };

    if (query.distributorId) {
      where.distributorId = query.distributorId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.billDate = {};
      if (query.startDate) where.billDate.gte = new Date(query.startDate);
      if (query.endDate) where.billDate.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.invoiceNo = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { billDate: 'desc' };

    const { bills, total } = await purchaseRepository.findBills({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      bills,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBill(id, data, userId) {
    const existing = await purchaseRepository.findBillById(id);
    if (!existing) {
      throw new ApiError(404, 'Purchase bill not found.');
    }
    if (existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to update this bill.');
    }

    const subtotal = data.subtotal !== undefined ? parseFloat(data.subtotal) : Number(existing.subtotal);
    const gstAmount = data.gstAmount !== undefined ? parseFloat(data.gstAmount) : Number(existing.gstAmount);
    const discountAmount = data.discountAmount !== undefined ? parseFloat(data.discountAmount) : Number(existing.discountAmount);
    const grandTotal = subtotal + gstAmount - discountAmount;
    
    const paidAmount = data.paidAmount !== undefined ? parseFloat(data.paidAmount) : Number(existing.paidAmount);

    let status = 'PENDING';
    if (paidAmount >= grandTotal) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIAL';

    const payload = {
      invoiceNo: data.invoiceNo || existing.invoiceNo,
      distributorId: data.distributorId || existing.distributorId,
      billDate: data.billDate ? new Date(data.billDate) : existing.billDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
      subtotal,
      gstAmount,
      discountAmount,
      grandTotal,
      paidAmount,
      status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    return purchaseRepository.updateBill(id, payload);
  }

  async deleteBill(id, userId) {
    const existing = await purchaseRepository.findBillById(id);
    if (!existing) {
      throw new ApiError(404, 'Purchase bill not found.');
    }
    if (existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this bill.');
    }

    // Reverse bank transaction if it exists
    const prisma = require('../config/prisma');
    const bankRepository = require('../repositories/bank.repository');
    const tag = `[PurchaseBill:${id}]`;
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });
    if (existingTxn) {
      await bankRepository.adjustBalance(existingTxn.accountId, Number(existingTxn.amount));
      await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
    }

    // Otherwise reverse from cashbook if paid amount existed
    if (!existingTxn && Number(existing.paidAmount) > 0) {
      await this._reversePurchaseFromCashBook(existing);
    }

    return purchaseRepository.deleteBill(id);
  }

  async getPurchaseStats(query, userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthClause = {
      createdById: userId,
      billDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    const monthStats = await purchaseRepository.aggregatePurchaseStats(monthClause);

    const overallStats = await purchaseRepository.aggregatePurchaseStats({ createdById: userId });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const dueWeekStats = await purchaseRepository.aggregatePurchaseStats({
      createdById: userId,
      status: { in: ['PENDING', 'PARTIAL'] },
      dueDate: {
        gte: new Date(),
        lte: nextWeek,
      },
    });

    return {
      outstandingDues: overallStats.outstandingDues,
      monthPurchases: monthStats.totalPurchases,
      dueSoonAmount: dueWeekStats.outstandingDues,
      dueSoonCount: dueWeekStats.billsCount,
    };
  }

  /**
   * Sync cash purchase payment into CashBook totalExpenses for the bill date.
   */
  async _syncPurchaseToCashBook(bill) {
    const prisma = require('../config/prisma');
    const billDate = new Date(bill.billDate);
    const startOfDay = new Date(billDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(billDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    let cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: bill.createdById,
      },
    });

    const paidAmount = Number(bill.paidAmount);

    if (cashBook) {
      const newTotalExp = Number(cashBook.totalExpenses) + paidAmount;
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
      await prisma.cashBook.create({
        data: {
          date: startOfDay,
          openingCash: 0,
          cashSales: 0,
          upiReceipts: 0,
          cardReceipts: 0,
          otherIncome: 0,
          totalExpenses: paidAmount,
          bankDeposit: 0,
          closingCash: 0,
          cashDifference: -paidAmount,
          notes: `Auto-created from stock purchase: Invoice #${bill.invoiceNo}`,
          createdById: bill.createdById,
        },
      });
    }
  }

  async _syncPurchaseToBank(bill, paymentMode, bankAccountId, userId) {
    const prisma = require('../config/prisma');
    const bankRepository = require('../repositories/bank.repository');
    const cashBookService = require('./cashbook.service');

    let targetBankAccountId = bankAccountId;
    if (!targetBankAccountId) {
      const primaryBank = await cashBookService._findPrimaryBankAccount(userId);
      if (primaryBank) {
        targetBankAccountId = primaryBank.id;
      }
    }

    if (!targetBankAccountId) return;

    const tag = `[PurchaseBill:${bill.id}]`;
    const description = `Stock Purchase Advance: Invoice #${bill.invoiceNo} ${tag}`;
    const amount = Number(bill.paidAmount);

    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (existingTxn) {
      const prevAmount = Number(existingTxn.amount);
      const delta = amount - prevAmount;
      if (delta !== 0) {
        await prisma.bankTransaction.update({
          where: { id: existingTxn.id },
          data: { amount, description },
        });
        await bankRepository.adjustBalance(existingTxn.accountId, -delta);
      }
    } else {
      const account = await bankRepository.findAccountById(targetBankAccountId);
      if (!account) return;
      const newBalance = Number(account.currentBalance) - amount;
      await prisma.bankTransaction.create({
        data: {
          accountId: targetBankAccountId,
          type: 'WITHDRAWAL',
          date: bill.billDate || new Date(),
          amount,
          description,
          runningBalance: newBalance,
          createdById: userId,
        },
      });
      await bankRepository.adjustBalance(targetBankAccountId, -amount);
    }
  }

  async _reversePurchaseFromCashBook(bill) {
    const prisma = require('../config/prisma');
    const billDate = new Date(bill.billDate);
    const startOfDay = new Date(billDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(billDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: bill.createdById,
      },
    });

    if (cashBook) {
      const paidAmount = Number(bill.paidAmount);
      const newTotalExp = Math.max(0, Number(cashBook.totalExpenses) - paidAmount);
      const expectedClosing = Number(cashBook.openingCash) + Number(cashBook.cashSales) - newTotalExp;
      const newDifference = Number(cashBook.closingCash) - expectedClosing;

      await prisma.cashBook.update({
        where: { id: cashBook.id },
        data: {
          totalExpenses: newTotalExp,
          cashDifference: newDifference,
        },
      });
    }
  }
}

module.exports = new PurchaseService();
