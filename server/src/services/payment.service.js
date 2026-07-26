// src/services/payment.service.js
const paymentRepository = require('../repositories/payment.repository');
const purchaseRepository = require('../repositories/purchase.repository');
const broadcastService = require('./broadcast.service');
const cashBookService = require('./cashbook.service');
const ApiError = require('../utils/ApiError');

class PaymentService {
  async createPayment(data, userId) {
    if (data.paymentMode === 'BOTH') {
      const cashAmount = parseFloat(data.cashAmount || 0);
      const upiAmount = parseFloat(data.upiAmount || 0);
      let cashPay = null;
      let upiPay = null;
      if (cashAmount > 0) {
        cashPay = await this.createPayment({
          ...data,
          amount: cashAmount,
          paymentMode: 'CASH',
        }, userId);
      }
      if (upiAmount > 0) {
        upiPay = await this.createPayment({
          ...data,
          amount: upiAmount,
          paymentMode: 'UPI',
          bankAccountId: data.bankAccountId,
        }, userId);
      }
      return upiPay || cashPay;
    }

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

    // Sync payment withdrawal to primary bank account if not CASH
    if (payment.paymentMode !== 'CASH') {
      await this._syncPaymentToBank(payment, data.bankAccountId || null, userId);
    }

    // Recalculate all bill statuses for this distributor
    await this._recalcDistributorBills(data.distributorId);

    // Sync distributor payment into CashBook for that date
    await cashBookService.syncTotalExpenses(userId, payment.paymentDate);

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

    // Clean up bank transaction
    await this._cleanupPaymentBankSync(payment);

    // Sync CashBook totals for the date of deletion
    await cashBookService.syncTotalExpenses(payment.createdById, payment.paymentDate);

    // Recalculate all bill statuses for this distributor after reversing payment
    if (distributorId) {
      await this._recalcDistributorBills(distributorId);
    }

    return { message: 'Payment deleted successfully.' };
  }

  async updatePayment(id, data, userId) {
    const existing = await paymentRepository.findPaymentById(id);
    if (!existing) {
      throw new ApiError(404, 'Payment not found.');
    }
    if (existing.createdById && existing.createdById !== userId) {
      throw new ApiError(403, 'You do not have permission to update this payment.');
    }

    // Validate distributor exists if changed
    let distributorId = existing.distributorId;
    if (data.distributorId && data.distributorId !== existing.distributorId) {
      const distributor = await purchaseRepository.findDistributorById(data.distributorId);
      if (!distributor) {
        throw new ApiError(404, 'Distributor not found.');
      }
      distributorId = data.distributorId;
    }

    // Validate linked bill if changed
    let billId = existing.billId;
    if (data.billId !== undefined) {
      if (data.billId) {
        const bill = await purchaseRepository.findBillById(data.billId);
        if (!bill) {
          throw new ApiError(404, 'Purchase bill not found.');
        }
        if (bill.distributorId !== distributorId) {
          throw new ApiError(400, 'The specified bill does not belong to this distributor.');
        }
      }
      billId = data.billId;
    }

    const amount = data.amount !== undefined ? parseFloat(data.amount) : Number(existing.amount);
    const paymentMode = data.paymentMode || existing.paymentMode;
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : existing.paymentDate;

    const payload = {
      distributorId,
      billId,
      paymentDate,
      amount,
      paymentMode,
      referenceNo: data.referenceNo !== undefined ? data.referenceNo : existing.referenceNo,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    // If payment mode or amount changed, clean up previous bank transaction first
    if (paymentMode !== existing.paymentMode || amount !== Number(existing.amount) || paymentDate.getTime() !== existing.paymentDate.getTime()) {
      await this._cleanupPaymentBankSync(existing);
    }

    const updated = await paymentRepository.updatePayment(id, payload);

    // Sync updated payment withdrawal to bank if not CASH
    if (updated.paymentMode !== 'CASH') {
      await this._syncPaymentToBank(updated, data.bankAccountId || null, userId);
    }

    // Recalculate bill statuses for both the old distributor and new distributor (in case it changed)
    await this._recalcDistributorBills(existing.distributorId);
    if (distributorId !== existing.distributorId) {
      await this._recalcDistributorBills(distributorId);
    }

    // Sync CashBook totals for old date and new date
    await cashBookService.syncTotalExpenses(userId, existing.paymentDate);
    if (paymentDate.getTime() !== existing.paymentDate.getTime()) {
      await cashBookService.syncTotalExpenses(userId, paymentDate);
    }

    return updated;
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

  async _syncPaymentToBank(payment, bankAccountId, userId) {
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

    // Fetch distributor info for description
    const distributor = await prisma.distributor.findUnique({
      where: { id: payment.distributorId },
    });

    const tag = `[DistributorPayment:${payment.id}]`;
    const description = `Distributor Payment (${distributor?.name || 'Supplier'}) ${tag}`;
    const amount = Number(payment.amount);

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
          date: payment.paymentDate || new Date(),
          amount,
          description,
          runningBalance: newBalance,
          createdById: userId,
        },
      });
      await bankRepository.adjustBalance(targetBankAccountId, -amount);
    }
  }

  async _cleanupPaymentBankSync(payment) {
    const prisma = require('../config/prisma');
    const bankRepository = require('../repositories/bank.repository');

    const tag = `[DistributorPayment:${payment.id}]`;
    const existingTxn = await prisma.bankTransaction.findFirst({
      where: { description: { contains: tag } },
    });

    if (existingTxn) {
      await bankRepository.adjustBalance(existingTxn.accountId, Number(existingTxn.amount));
      await prisma.bankTransaction.delete({ where: { id: existingTxn.id } });
    }
  }

}

module.exports = new PaymentService();
