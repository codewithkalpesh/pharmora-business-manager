// src/services/payment.service.js
const paymentRepository = require('../repositories/payment.repository');
const purchaseRepository = require('../repositories/purchase.repository');
const broadcastService = require('./broadcast.service');
const ApiError = require('../utils/ApiError');

class PaymentService {
  async createPayment(data, userId) {
    // Validate distributor exists
    const distributor = await purchaseRepository.findDistributorById(data.distributorId);
    if (!distributor) {
      throw new ApiError(404, 'Distributor not found.');
    }

    // If linked to a bill, validate bill belongs to the same distributor
    if (data.billId) {
      const bill = await purchaseRepository.findBillById(data.billId);
      if (!bill) {
        throw new ApiError(404, 'Purchase bill not found.');
      }
      if (bill.distributorId !== data.distributorId) {
        throw new ApiError(400, 'The specified bill does not belong to this distributor.');
      }
    }

    const amount = parseFloat(data.amount);
    const payload = {
      distributorId: data.distributorId,
      billId: data.billId || null,
      paymentDate: new Date(data.paymentDate),
      amount,
      paymentMode: data.paymentMode || 'CASH',
      referenceNo: data.referenceNo || null,
      notes: data.notes || null,
      createdById: userId,
    };

    const payment = await paymentRepository.createPayment(payload);

    // Recalculate all bill statuses for this distributor
    await this._recalcDistributorBills(data.distributorId);

    // Sync CASH distributor payment into CashBook for that date
    if (payment.paymentMode === 'CASH') {
      await this._syncPaymentToCashBook(payment, distributor.name);
    }

    // Broadcast transaction
    broadcastService.broadcastTransaction({
      userId,
      type: 'DISTRIBUTOR_PAYMENT',
      amount: payment.amount,
      partyName: distributor.name,
      description: payment.notes || `Distributor Payment: ${distributor.name}`,
      paymentMode: payment.paymentMode,
      date: payment.paymentDate,
    });

    return payment;
  }

  async getPayments(query, userId) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.createdById = userId;

    if (query.distributorId) {
      where.distributorId = query.distributorId;
    }

    if (query.billId) {
      where.billId = query.billId;
    }

    if (query.startDate || query.endDate) {
      where.paymentDate = {};
      if (query.startDate) where.paymentDate.gte = new Date(query.startDate);
      if (query.endDate) where.paymentDate.lte = new Date(query.endDate);
    }

    if (query.paymentMode) {
      where.paymentMode = query.paymentMode;
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortDesc === 'true' ? 'desc' : 'asc' }
      : { paymentDate: 'desc' };

    const { payments, total } = await paymentRepository.findPayments({ skip, take: limit, where, orderBy });

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deletePayment(id, userId) {
    const payment = await paymentRepository.findPaymentById(id);
    if (!payment) {
      throw new ApiError(404, 'Payment not found.');
    }
    if (payment.createdById && payment.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this payment.');
    }

    const distributorId = payment.distributorId;
    await paymentRepository.deletePayment(id);

    // Clean up CashBook sync if payment mode was CASH
    if (payment.paymentMode === 'CASH') {
      await this._cleanupPaymentFromCashBook(payment);
    }

    // Recalculate all bill statuses for this distributor after reversing payment
    if (distributorId) {
      await this._recalcDistributorBills(distributorId);
    }

    return { message: 'Payment deleted successfully.' };
  }

  async getDistributorLedger(distributorId, userId) {
    const distributor = await purchaseRepository.findDistributorById(distributorId);
    if (!distributor) {
      throw new ApiError(404, 'Distributor not found.');
    }
    if (distributor.createdById && distributor.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to view this distributor\'s ledger.');
    }

    const { bills, payments } = await paymentRepository.getDistributorLedger(distributorId);

    // Build chronological ledger entries
    const ledger = [];

    for (const bill of bills) {
      ledger.push({
        type: 'bill',
        date: bill.billDate,
        id: bill.id,
        description: `Invoice #${bill.invoiceNo}`,
        debit: Number(bill.grandTotal),
        credit: 0,
        status: bill.status,
        details: bill,
      });
    }

    for (const pay of payments) {
      ledger.push({
        type: 'payment',
        date: pay.paymentDate,
        id: pay.id,
        description: `Payment via ${pay.paymentMode}${pay.referenceNo ? ` (Ref: ${pay.referenceNo})` : ''}`,
        debit: 0,
        credit: Number(pay.amount),
        status: null,
        details: pay,
      });
    }

    // Sort by date descending
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Running balance (most recent first, so we compute net outstanding)
    const totalBilled = bills.reduce((sum, b) => sum + Number(b.grandTotal), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = totalBilled - totalPaid;

    return {
      distributor,
      ledger,
      summary: {
        totalBilled,
        totalPaid,
        outstanding,
        billCount: bills.length,
        paymentCount: payments.length,
      },
    };
  }

  async getPaymentStats(userId) {
    return paymentRepository.getPaymentStats(userId);
  }

  // Private: recalculate all bill statuses for a distributor based on linked & unlinked payments
  async _recalcDistributorBills(distributorId) {
    if (!distributorId) return;
    const prisma = require('../config/prisma');

    const bills = await prisma.purchaseBill.findMany({
      where: { distributorId },
      orderBy: { billDate: 'asc' },
    });

    if (bills.length === 0) return;

    const payments = await prisma.distributorPayment.findMany({
      where: { distributorId },
    });

    const explicitMap = {};
    let unlinkedPool = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      if (p.billId) {
        explicitMap[p.billId] = (explicitMap[p.billId] || 0) + amt;
      } else {
        unlinkedPool += amt;
      }
    }

    for (const bill of bills) {
      const grandTotal = Number(bill.grandTotal);
      const explicitPaid = explicitMap[bill.id] || 0;

      let billPaid = explicitPaid;
      const needed = Math.max(0, grandTotal - explicitPaid);

      if (needed > 0 && unlinkedPool > 0) {
        const alloc = Math.min(unlinkedPool, needed);
        billPaid += alloc;
        unlinkedPool -= alloc;
      }

      let status = 'PENDING';
      if (billPaid >= grandTotal) status = 'PAID';
      else if (billPaid > 0) status = 'PARTIAL';

      await prisma.purchaseBill.update({
        where: { id: bill.id },
        data: { paidAmount: billPaid, status },
      });
    }
  }

  async _syncPaymentToCashBook(payment, distributorName) {
    const prisma = require('../config/prisma');
    const paymentDate = new Date(payment.paymentDate);
    const startOfDay = new Date(paymentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(paymentDate);
    endOfDay.setHours(23, 59, 59, 999);

    let cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: payment.createdById,
      },
    });

    const amt = Number(payment.amount);

    if (cashBook) {
      const newTotalExp = Number(cashBook.totalExpenses) + amt;
      const expectedClosing = Number(cashBook.openingCash) + Number(cashBook.cashSales) + Number(cashBook.upiReceipts) + Number(cashBook.cardReceipts) + Number(cashBook.otherIncome) - newTotalExp - Number(cashBook.bankDeposit);
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
          totalExpenses: amt,
          bankDeposit: 0,
          closingCash: 0,
          cashDifference: -amt,
          notes: `Auto-created from supplier payment to ${distributorName || 'Supplier'}`,
          createdById: payment.createdById,
        },
      });
    }
  }

  async _cleanupPaymentFromCashBook(payment) {
    if (!payment) return;
    const prisma = require('../config/prisma');
    const paymentDate = new Date(payment.paymentDate);
    const startOfDay = new Date(paymentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(paymentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const cashBook = await prisma.cashBook.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        createdById: payment.createdById,
      },
    });

    if (cashBook) {
      const amt = Number(payment.amount);
      const newTotalExp = Math.max(0, Number(cashBook.totalExpenses) - amt);
      const expectedClosing = Number(cashBook.openingCash) + Number(cashBook.cashSales) + Number(cashBook.upiReceipts) + Number(cashBook.cardReceipts) + Number(cashBook.otherIncome) - newTotalExp - Number(cashBook.bankDeposit);
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

module.exports = new PaymentService();
