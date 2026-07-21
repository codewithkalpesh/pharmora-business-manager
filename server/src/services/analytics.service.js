// src/services/analytics.service.js
const prisma = require('../config/prisma');

const getMonthRange = (monthsAgo = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Revenue vs Expense trend for last N months
 */
const getRevenueVsExpenseTrend = async (userId, months = 6) => {
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const { start, end } = getMonthRange(i);
    const label = `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;

    const cbWhere = { date: { gte: start, lte: end } };
    const expWhere = { date: { gte: start, lte: end } };
    const distPayWhere = { paymentDate: { gte: start, lte: end } };

    if (userId) {
      cbWhere.createdById = userId;
      expWhere.createdById = userId;
      distPayWhere.createdById = userId;
    }

    const [revenue, expenses, distPayments] = await Promise.all([
      prisma.cashBook.aggregate({
        where: cbWhere,
        _sum: { cashSales: true, upiReceipts: true, cardReceipts: true, otherIncome: true },
      }),
      prisma.expense.aggregate({
        where: expWhere,
        _sum: { amount: true },
      }),
      prisma.distributorPayment.aggregate({
        where: distPayWhere,
        _sum: { amount: true },
      }),
    ]);

    const rev =
      Number(revenue._sum.cashSales || 0) +
      Number(revenue._sum.upiReceipts || 0) +
      Number(revenue._sum.cardReceipts || 0) +
      Number(revenue._sum.otherIncome || 0);

    const exp = Number(expenses._sum.amount || 0) + Number(distPayments._sum.amount || 0);

    results.push({ month: label, revenue: rev, expenses: exp, profit: rev - exp });
  }

  return results;
};

/**
 * Expense breakdown by category for last N months
 */
const getExpenseBreakdownByCategory = async (userId, months = 6) => {
  const { start } = getMonthRange(months - 1);
  const end = new Date();

  const expWhere = { date: { gte: start, lte: end } };
  const distPayWhere = { paymentDate: { gte: start, lte: end } };
  if (userId) {
    expWhere.createdById = userId;
    distPayWhere.createdById = userId;
  }

  const [data, distPayAgg] = await Promise.all([
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: expWhere,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    }),
    prisma.distributorPayment.aggregate({
      where: distPayWhere,
      _sum: { amount: true },
    }),
  ]);

  const categories = await prisma.expenseCategory.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const results = data.map((d) => ({
    category: catMap[d.categoryId]?.name || 'Unknown',
    color: catMap[d.categoryId]?.color || '#6366f1',
    amount: Number(d._sum.amount || 0),
  }));

  const distPayTotal = Number(distPayAgg._sum.amount || 0);
  if (distPayTotal > 0) {
    results.push({
      category: 'Supplier / Distributor Payments',
      color: '#ec4899',
      amount: distPayTotal,
    });
  }

  const total = results.reduce((s, d) => s + d.amount, 0);

  return results.map((d) => ({
    ...d,
    percentage: total > 0 ? ((d.amount / total) * 100).toFixed(1) : 0,
  }));
};

/**
 * Payment mode distribution for expenses & supplier payments
 */
const getPaymentModeDistribution = async (userId, months = 3) => {
  const { start } = getMonthRange(months - 1);
  const end = new Date();

  const expWhere = { date: { gte: start, lte: end } };
  const distPayWhere = { paymentDate: { gte: start, lte: end } };
  if (userId) {
    expWhere.createdById = userId;
    distPayWhere.createdById = userId;
  }

  const [expData, distData] = await Promise.all([
    prisma.expense.groupBy({
      by: ['paymentMode'],
      where: expWhere,
      _sum: { amount: true },
    }),
    prisma.distributorPayment.groupBy({
      by: ['paymentMode'],
      where: distPayWhere,
      _sum: { amount: true },
    }),
  ]);

  const map = {};
  expData.forEach((d) => {
    map[d.paymentMode] = (map[d.paymentMode] || 0) + Number(d._sum.amount || 0);
  });
  distData.forEach((d) => {
    map[d.paymentMode] = (map[d.paymentMode] || 0) + Number(d._sum.amount || 0);
  });

  const total = Object.values(map).reduce((s, v) => s + v, 0);

  const colorMap = {
    CASH: '#10b981',
    UPI: '#3b82f6',
    CARD: '#8b5cf6',
    CHEQUE: '#f59e0b',
    BANK_TRANSFER: '#06b6d4',
    OTHER: '#64748b',
  };

  return Object.entries(map).map(([mode, amount]) => ({
    mode,
    amount,
    percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
    color: colorMap[mode] || '#64748b',
  }));
};

/**
 * Top distributors by total purchase spend
 */
const getTopDistributors = async (userId, limit = 10) => {
  const billWhere = {};
  if (userId) billWhere.createdById = userId;

  const data = await prisma.purchaseBill.groupBy({
    by: ['distributorId'],
    where: billWhere,
    _sum: { grandTotal: true },
    orderBy: { _sum: { grandTotal: 'desc' } },
    take: limit,
  });

  const distWhere = {};
  if (userId) distWhere.createdById = userId;
  const distributors = await prisma.distributor.findMany({ where: distWhere });
  const distMap = Object.fromEntries(distributors.map((d) => [d.id, d]));

  return data.map((d) => ({
    name: distMap[d.distributorId]?.name || 'Unknown',
    totalSpend: Number(d._sum.grandTotal || 0),
  }));
};

/**
 * Bank balance trend (current snapshot of each account)
 */
const getBankBalanceSummary = async (userId) => {
  const bankWhere = { isActive: true };
  if (userId) bankWhere.createdById = userId;

  const accounts = await prisma.bankAccount.findMany({
    where: bankWhere,
    select: {
      bankName: true,
      accountName: true,
      currentBalance: true,
      openingBalance: true,
    },
    orderBy: { currentBalance: 'desc' },
  });

  return accounts.map((a) => ({
    name: `${a.bankName} (${a.accountName})`,
    currentBalance: Number(a.currentBalance),
    openingBalance: Number(a.openingBalance),
    change: Number(a.currentBalance) - Number(a.openingBalance),
  }));
};

/**
 * Customer credit summary (outstanding receivables)
 */
const getCustomerCreditSummary = async (userId) => {
  const creditWhere = { status: { in: ['PENDING', 'PARTIAL'] } };
  if (userId) creditWhere.createdById = userId;

  const data = await prisma.customerCredit.groupBy({
    by: ['customerId'],
    where: creditWhere,
    _sum: { amount: true, paidAmount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 10,
  });

  const custWhere = {};
  if (userId) custWhere.createdById = userId;
  const customers = await prisma.customer.findMany({ where: custWhere });
  const custMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  return data.map((d) => ({
    name: custMap[d.customerId]?.name || 'Unknown',
    phone: custMap[d.customerId]?.phone || '',
    outstanding: Number(d._sum.amount || 0) - Number(d._sum.paidAmount || 0),
    total: Number(d._sum.amount || 0),
  }));
};

/**
 * Summary KPIs for analytics page
 */
const getAnalyticsSummary = async (userId) => {
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  const thisRevWhere = { date: { gte: thisMonth.start, lte: thisMonth.end } };
  const lastRevWhere = { date: { gte: lastMonth.start, lte: lastMonth.end } };
  const thisExpWhere = { date: { gte: thisMonth.start, lte: thisMonth.end } };
  const lastExpWhere = { date: { gte: lastMonth.start, lte: lastMonth.end } };
  const thisDistPayWhere = { paymentDate: { gte: thisMonth.start, lte: thisMonth.end } };
  const lastDistPayWhere = { paymentDate: { gte: lastMonth.start, lte: lastMonth.end } };

  const custCreditWhere = { status: { in: ['PENDING', 'PARTIAL'] } };
  const purchaseBillWhere = { status: { in: ['PENDING', 'PARTIAL'] } };

  if (userId) {
    thisRevWhere.createdById = userId;
    lastRevWhere.createdById = userId;
    thisExpWhere.createdById = userId;
    lastExpWhere.createdById = userId;
    thisDistPayWhere.createdById = userId;
    lastDistPayWhere.createdById = userId;
    custCreditWhere.createdById = userId;
    purchaseBillWhere.createdById = userId;
  }

  const [
    thisRevenue,
    lastRevenue,
    thisExpenses,
    lastExpenses,
    thisDistPayments,
    lastDistPayments,
    totalCustomerOutstanding,
    totalDistributorPending,
  ] = await Promise.all([
    prisma.cashBook.aggregate({
      where: thisRevWhere,
      _sum: { cashSales: true, upiReceipts: true, cardReceipts: true, otherIncome: true },
    }),
    prisma.cashBook.aggregate({
      where: lastRevWhere,
      _sum: { cashSales: true, upiReceipts: true, cardReceipts: true, otherIncome: true },
    }),
    prisma.expense.aggregate({
      where: thisExpWhere,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: lastExpWhere,
      _sum: { amount: true },
    }),
    prisma.distributorPayment.aggregate({
      where: thisDistPayWhere,
      _sum: { amount: true },
    }),
    prisma.distributorPayment.aggregate({
      where: lastDistPayWhere,
      _sum: { amount: true },
    }),
    prisma.customerCredit.aggregate({
      where: custCreditWhere,
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.purchaseBill.aggregate({
      where: purchaseBillWhere,
      _sum: { grandTotal: true, paidAmount: true },
    }),
  ]);

  const calcRevenue = (agg) =>
    Number(agg._sum.cashSales || 0) +
    Number(agg._sum.upiReceipts || 0) +
    Number(agg._sum.cardReceipts || 0) +
    Number(agg._sum.otherIncome || 0);

  const thisRev = calcRevenue(thisRevenue);
  const lastRev = calcRevenue(lastRevenue);
  const thisExp = Number(thisExpenses._sum.amount || 0) + Number(thisDistPayments._sum.amount || 0);
  const lastExp = Number(lastExpenses._sum.amount || 0) + Number(lastDistPayments._sum.amount || 0);

  const revChange = lastRev > 0 ? (((thisRev - lastRev) / lastRev) * 100).toFixed(1) : null;
  const expChange = lastExp > 0 ? (((thisExp - lastExp) / lastExp) * 100).toFixed(1) : null;

  return {
    thisMonthRevenue: thisRev,
    lastMonthRevenue: lastRev,
    revenueChange: revChange ? parseFloat(revChange) : null,
    thisMonthExpenses: thisExp,
    lastMonthExpenses: lastExp,
    expenseChange: expChange ? parseFloat(expChange) : null,
    thisMonthProfit: thisRev - thisExp,
    lastMonthProfit: lastRev - lastExp,
    profitMargin: thisRev > 0 ? (((thisRev - thisExp) / thisRev) * 100).toFixed(1) : 0,
    totalCustomerOutstanding:
      Number(totalCustomerOutstanding._sum.amount || 0) -
      Number(totalCustomerOutstanding._sum.paidAmount || 0),
    totalDistributorPending:
      Number(totalDistributorPending._sum.grandTotal || 0) -
      Number(totalDistributorPending._sum.paidAmount || 0),
  };
};

module.exports = {
  getRevenueVsExpenseTrend,
  getExpenseBreakdownByCategory,
  getPaymentModeDistribution,
  getTopDistributors,
  getBankBalanceSummary,
  getCustomerCreditSummary,
  getAnalyticsSummary,
};
