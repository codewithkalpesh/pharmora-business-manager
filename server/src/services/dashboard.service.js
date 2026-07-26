// src/services/dashboard.service.js
const prisma = require('../config/prisma');

const getTodayRange = (refDate = new Date()) => {
  const start = new Date(refDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(refDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getMonthRange = (refDate = new Date()) => {
  const d = new Date(refDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getLast30DaysRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const getKPIs = async (userId, dateStr) => {
  const refDate = dateStr ? new Date(dateStr) : new Date();
  const today = getTodayRange(refDate);
  const month = getMonthRange(refDate);

  const [
    todayCashBook,
    latestCashBook,
    monthlyOperatingExpenses,
    monthlyDistributorPayments,
    todayOperatingExpenses,
    todayDistributorPayments,
    distributorPending,
    customerOutstanding,
    bankAccounts,
    monthlyRevenue,
    upcomingRecurring,
    recentExpenses,
    recentDistributorPayments,
    recentCashBooks,
    recentCustomerCollections,
    recentBorrowedRepayments,
    recentBorrowedAdditions,
    borrowedPending,
  ] = await Promise.all([
    // Today's cash book entry for this user
    prisma.cashBook.findFirst({
      where: { date: { gte: today.start, lte: today.end }, createdById: userId },
    }),
    // Latest cash book entry for actual cash in hand (on or before selected date)
    prisma.cashBook.findFirst({
      where: { date: { lte: today.end }, createdById: userId },
      orderBy: { date: 'desc' },
    }),
    // Monthly operating expenses for this user
    prisma.expense.aggregate({
      where: { date: { gte: month.start, lte: month.end }, createdById: userId },
      _sum: { amount: true },
    }),
    // Monthly distributor payments for this user
    prisma.distributorPayment.aggregate({
      where: { paymentDate: { gte: month.start, lte: month.end }, createdById: userId },
      _sum: { amount: true },
    }),
    // Today operating expenses
    prisma.expense.aggregate({
      where: { date: { gte: today.start, lte: today.end }, createdById: userId },
      _sum: { amount: true },
    }),
    // Today distributor payments
    prisma.distributorPayment.aggregate({
      where: { paymentDate: { gte: today.start, lte: today.end }, createdById: userId },
      _sum: { amount: true },
    }),
    // Total distributor outstanding (unpaid purchase bills for this user)
    prisma.purchaseBill.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] }, createdById: userId },
      _sum: { grandTotal: true, paidAmount: true },
    }),
    // Total customer outstanding for this user
    prisma.customerCredit.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] }, createdById: userId },
      _sum: { amount: true, paidAmount: true },
    }),
    // Bank balances - accounts created by this user
    prisma.bankAccount.findMany({
      where: {
        isActive: true,
        createdById: userId,
      },
      select: { bankName: true, accountName: true, currentBalance: true },
    }),
    // Monthly cash sales (from cash book) for this user
    prisma.cashBook.aggregate({
      where: { date: { gte: month.start, lte: month.end }, createdById: userId },
      _sum: { cashSales: true, upiReceipts: true, cardReceipts: true, otherIncome: true },
    }),
    // Upcoming recurring transactions for this user (next 7 days)
    prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        action: 'REMINDER_ONLY',
        createdById: userId,
        nextDueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { nextDueDate: 'asc' },
      take: 5,
    }),
    // Recent expenses for this user
    prisma.expense.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { category: { select: { name: true, color: true } } },
    }),
    // Recent distributor payments for this user
    prisma.distributorPayment.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { distributor: { select: { name: true } } },
    }),
    // Recent Cash Book entries for this user
    prisma.cashBook.findMany({
      where: { createdById: userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    // Recent Customer Collections for this user
    prisma.creditCollection.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } } },
    }),
    // Recent Borrowed Money Repayments
    prisma.borrowedRepayment.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { borrowedMoney: { select: { personName: true } } },
    }),
    // Recent Borrowed Money Additions
    prisma.borrowedMoney.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // Borrowed Money Outstanding
    prisma.borrowedMoney.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL'] }, createdById: userId },
      _sum: { targetAmount: true, paidAmount: true },
    }),
  ]);

  const todaySales =
    Number(todayCashBook?.cashSales || 0) +
    Number(todayCashBook?.upiReceipts || 0) +
    Number(todayCashBook?.cardReceipts || 0);

  const totalBankBalance = bankAccounts.reduce(
    (sum, acc) => sum + Number(acc.currentBalance),
    0
  );

  const distributorPendingAmount =
    Number(distributorPending._sum.grandTotal || 0) -
    Number(distributorPending._sum.paidAmount || 0);

  const customerOutstandingAmount =
    Number(customerOutstanding._sum.amount || 0) -
    Number(customerOutstanding._sum.paidAmount || 0);

  const borrowedPendingAmount =
    Number(borrowedPending._sum.targetAmount || 0) -
    Number(borrowedPending._sum.paidAmount || 0);

  const monthRevenue =
    Number(monthlyRevenue._sum.cashSales || 0) +
    Number(monthlyRevenue._sum.upiReceipts || 0) +
    Number(monthlyRevenue._sum.cardReceipts || 0) +
    Number(monthlyRevenue._sum.otherIncome || 0);

  const todayExp =
    Number(todayOperatingExpenses._sum.amount || 0) +
    Number(todayDistributorPayments._sum.amount || 0);

  const monthExpenses =
    Number(monthlyOperatingExpenses._sum.amount || 0) +
    Number(monthlyDistributorPayments._sum.amount || 0);

  const monthProfit = monthRevenue - monthExpenses;

  // Format all transaction streams for recent transactions
  const formattedExpenses = recentExpenses.map((e) => {
    const isRec = e.isRecurring || e.description?.includes('[RECURRING]') || e.description?.includes('[AUTO-DRAFT]');
    return {
      id: e.id,
      date: e.date,
      createdAt: e.createdAt,
      description: e.description,
      amount: Number(e.amount),
      isIncome: false,
      category: isRec ? { name: `Recurring (${e.category?.name || 'Bill'})`, color: '#8b5cf6' } : e.category,
      type: 'EXPENSE',
    };
  });

  const formattedDistPayments = recentDistributorPayments.map((p) => ({
    id: p.id,
    date: p.paymentDate,
    createdAt: p.createdAt,
    description: `Supplier Payment: ${p.distributor?.name || 'Supplier'}`,
    amount: Number(p.amount),
    isIncome: false,
    category: { name: 'Supplier Payment', color: '#ec4899' },
    type: 'DISTRIBUTOR_PAYMENT',
  }));

  const formattedCashBooks = recentCashBooks.map((cb) => {
    const totalReceipts =
      Number(cb.cashSales || 0) +
      Number(cb.upiReceipts || 0) +
      Number(cb.cardReceipts || 0) +
      Number(cb.otherIncome || 0);

    return {
      id: cb.id,
      date: cb.date,
      createdAt: cb.updatedAt || cb.createdAt,
      description: cb.notes || 'Daily Cash Book Sales & Receipts',
      amount: totalReceipts > 0 ? totalReceipts : Number(cb.totalExpenses || 0),
      isIncome: totalReceipts >= Number(cb.totalExpenses || 0),
      category: { name: 'Cash Book Entry', color: '#10b981' },
      type: 'CASHBOOK',
    };
  });

  const formattedCollections = recentCustomerCollections.map((c) => ({
    id: c.id,
    date: c.collectionDate,
    createdAt: c.createdAt,
    description: `Customer Collection: ${c.customer?.name || 'Customer'}`,
    amount: Number(c.amount),
    isIncome: true,
    category: { name: 'Credit Collection', color: '#3b82f6' },
    type: 'COLLECTION',
  }));

  const formattedRepayments = recentBorrowedRepayments.map((r) => ({
    id: r.id,
    date: r.repaymentDate,
    createdAt: r.createdAt,
    description: `Repayment to ${r.borrowedMoney?.personName || 'Lender'}`,
    amount: Number(r.amount),
    isIncome: false,
    category: { name: 'Borrowed Repayment', color: '#f59e0b' },
    type: 'BORROWED_REPAYMENT',
  }));

  const formattedAdditions = recentBorrowedAdditions.map((b) => ({
    id: b.id,
    date: b.borrowDate,
    createdAt: b.createdAt,
    description: `Borrowed from ${b.personName}`,
    amount: Number(b.borrowedAmount),
    isIncome: true,
    category: { name: 'Borrowed Money Received', color: '#06b6d4' },
    type: 'BORROWED_MONEY',
  }));

  const recentTransactions = [
    ...formattedExpenses,
    ...formattedDistPayments,
    ...formattedCashBooks,
    ...formattedCollections,
    ...formattedRepayments,
    ...formattedAdditions,
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  let cashInHand = 0;
  if (latestCashBook) {
    const closing = Number(latestCashBook.closingCash) || 0;
    if (closing > 0) {
      cashInHand = closing;
    } else {
      const opening = Number(latestCashBook.openingCash) || 0;
      const sales = Number(latestCashBook.cashSales) || 0;
      const other = Number(latestCashBook.otherIncome) || 0;
      const expenses = Number(latestCashBook.totalExpenses) || 0;
      const deposit = Number(latestCashBook.bankDeposit) || 0;
      cashInHand = opening + sales + other - expenses - deposit;
    }
  }

  return {
    kpis: {
      todaySales,
      todayExpenses: todayExp,
      cashInHand,
      bankBalance: totalBankBalance,
      distributorPending: distributorPendingAmount,
      customerCredit: customerOutstandingAmount,
      borrowedPending: borrowedPendingAmount,
      monthlyProfit: monthProfit,
      monthlyRevenue: monthRevenue,
      netCashFlow: monthRevenue - monthExpenses,
    },
    bankAccounts,
    upcomingRecurring,
    recentTransactions,
  };
};

const getSalesTrend = async (userId) => {
  const { start } = getLast30DaysRange();

  const cashBooks = await prisma.cashBook.findMany({
    where: { date: { gte: start }, createdById: userId },
    orderBy: { date: 'asc' },
    select: { date: true, cashSales: true, upiReceipts: true, cardReceipts: true },
  });

  return cashBooks.map((cb) => ({
    date: cb.date,
    sales:
      Number(cb.cashSales) + Number(cb.upiReceipts) + Number(cb.cardReceipts),
  }));
};

const getExpenseTrend = async (userId) => {
  const { start } = getLast30DaysRange();

  const [expenses, distPayments] = await Promise.all([
    prisma.expense.groupBy({
      by: ['date'],
      where: { date: { gte: start }, createdById: userId },
      _sum: { amount: true },
      orderBy: { date: 'asc' },
    }),
    prisma.distributorPayment.groupBy({
      by: ['paymentDate'],
      where: { paymentDate: { gte: start }, createdById: userId },
      _sum: { amount: true },
      orderBy: { paymentDate: 'asc' },
    }),
  ]);

  const map = {};

  expenses.forEach((e) => {
    const key = new Date(e.date).toISOString().split('T')[0];
    map[key] = (map[key] || 0) + Number(e._sum.amount || 0);
  });

  distPayments.forEach((dp) => {
    const key = new Date(dp.paymentDate).toISOString().split('T')[0];
    map[key] = (map[key] || 0) + Number(dp._sum.amount || 0);
  });

  return Object.entries(map)
    .map(([dateStr, amount]) => ({ date: new Date(dateStr), amount }))
    .sort((a, b) => a.date - b.date);
};

const getExpenseByCategory = async (userId) => {
  const month = getMonthRange();

  const [data, distPayAgg] = await Promise.all([
    prisma.expense.groupBy({
      by: ['categoryId'],
      where: { date: { gte: month.start, lte: month.end }, createdById: userId },
      _sum: { amount: true },
    }),
    prisma.distributorPayment.aggregate({
      where: { paymentDate: { gte: month.start, lte: month.end }, createdById: userId },
      _sum: { amount: true },
    }),
  ]);

  const categories = await prisma.expenseCategory.findMany();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const results = data.map((d) => ({
    category: categoryMap[d.categoryId]?.name || 'Unknown',
    color: categoryMap[d.categoryId]?.color || '#6366f1',
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

  return results;
};

// ─── Dedicated History Services ─────────────────────────────────────────────

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const parseDateFilter = (query) => {
  let start, end;
  if (query.startDate && query.endDate) {
    start = new Date(query.startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);
  } else if (query.month) {
    const parts = query.month.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    end = new Date(year, month, 0, 23, 59, 59, 999);
  } else if (query.year) {
    const year = parseInt(query.year, 10);
    start = new Date(year, 0, 1, 0, 0, 0, 0);
    end = new Date(year, 11, 31, 23, 59, 59, 999);
  } else {
    // Default to full range if not filtered, or default month
    start = new Date('2000-01-01');
    end = new Date('2099-12-31');
  }
  return { start, end };
};

const getExpenseHistory = async (userId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  const { start, end } = parseDateFilter(query);

  const where = {
    createdById: userId,
    date: { gte: start, lte: end },
  };

  if (query.search) {
    where.description = { contains: query.search, mode: 'insensitive' };
  }

  // Calculate cumulative running total chronologically across all user expenses up to date
  const allUserExpenses = await prisma.expense.findMany({
    where: { createdById: userId },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, amount: true },
  });

  const runningMap = new Map();
  let cumulative = 0;
  for (const exp of allUserExpenses) {
    cumulative += Number(exp.amount);
    runningMap.set(exp.id, cumulative);
  }

  const [expenses, totalCount, aggregateSum] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  const formattedData = expenses.map((exp) => ({
    id: exp.id,
    date: exp.date,
    time: formatTime(exp.date),
    category: exp.category?.name || 'Miscellaneous',
    categoryColor: exp.category?.color || '#64748b',
    description: exp.description,
    amount: Number(exp.amount),
    runningTotal: runningMap.get(exp.id) || Number(exp.amount),
    addedBy: exp.createdBy?.name || 'Staff',
  }));

  const totalExpense = Number(aggregateSum._sum.amount || 0);

  return {
    summary: {
      totalTransactions: totalCount,
      totalExpense,
    },
    data: formattedData,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

const getCashHistory = async (userId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  const { start, end } = parseDateFilter(query);

  const where = {
    createdById: userId,
    date: { gte: start, lte: end },
  };

  const [cashBooks, totalCount, summaryAgg] = await Promise.all([
    prisma.cashBook.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.cashBook.count({ where }),
    prisma.cashBook.aggregate({
      where,
      _sum: {
        cashSales: true,
        totalExpenses: true,
        bankDeposits: true,
      },
    }),
  ]);

  const formattedData = cashBooks.map((entry) => {
    const opening = Number(entry.openingCash);
    const sales = Number(entry.cashSales);
    const expenses = Number(entry.totalExpenses);
    const deposits = Number(entry.bankDeposits);
    const withdrawn = Number(entry.cashWithdrawn || 0);
    // Formula: Closing Cash = Opening Cash + Cash Sales + Cash Withdrawn - Cash Expenses - Cash Deposits
    const closing = opening + sales + withdrawn - expenses - deposits;

    return {
      id: entry.id,
      date: entry.date,
      openingCash: opening,
      cashSales: sales,
      cashExpenses: expenses,
      cashDeposits: deposits,
      cashWithdrawn: withdrawn,
      closingCash: closing,
      difference: Number(entry.cashDifference),
      notes: entry.notes,
    };
  });

  const latestEntry = await prisma.cashBook.findFirst({
    where: { createdById: userId },
    orderBy: { date: 'desc' },
  });

  const summary = {
    totalCashSales: Number(summaryAgg._sum.cashSales || 0),
    totalCashExpenses: Number(summaryAgg._sum.totalExpenses || 0),
    totalDeposits: Number(summaryAgg._sum.bankDeposits || 0),
    currentCashBalance: latestEntry ? Number(latestEntry.closingCash) : 0,
  };

  return {
    summary,
    data: formattedData,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

const getBankHistory = async (userId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  const { start, end } = parseDateFilter(query);

  const where = {
    createdById: userId,
    date: { gte: start, lte: end },
  };

  // Group bank activity by day from CashBook & BankTransactions
  const [cashBooks, totalCount, bankAccounts] = await Promise.all([
    prisma.cashBook.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.cashBook.count({ where }),
    prisma.bankAccount.findMany({
      where: { createdById: userId, isActive: true },
      select: { currentBalance: true },
    }),
  ]);

  let totalUPICollection = 0;
  let totalDeposits = 0;
  let totalExpenses = 0;

  const formattedData = cashBooks.map((entry) => {
    const upi = Number(entry.upiReceipts);
    const deposits = Number(entry.bankDeposits);
    const expenses = Number(entry.bankExpenses || 0);
    const withdrawal = Number(entry.cashWithdrawn || 0);

    totalUPICollection += upi;
    totalDeposits += deposits;
    totalExpenses += expenses;

    // Formula: Closing Bank Balance = Opening + UPI Collection + Cash Deposited - Bank Expense - Withdrawals
    const opening = Number(entry.bankOpeningBalance || 0);
    const closing = opening + upi + deposits - expenses - withdrawal;

    return {
      id: entry.id,
      date: entry.date,
      openingBalance: opening,
      upiCollection: upi,
      cashDeposited: deposits,
      bankExpense: expenses,
      bankWithdrawal: withdrawal,
      closingBalance: closing,
    };
  });

  const totalCurrentBankBalance = bankAccounts.reduce(
    (acc, b) => acc + Number(b.currentBalance),
    0
  );

  return {
    summary: {
      totalUPICollection,
      totalDeposits,
      totalExpenses,
      currentBankBalance: totalCurrentBankBalance,
    },
    data: formattedData,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

const getRevenueHistory = async (userId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 30;
  const skip = (page - 1) * limit;

  const { start, end } = parseDateFilter(query);

  const where = {
    createdById: userId,
    date: { gte: start, lte: end },
  };

  const [cashBooks, totalCount] = await Promise.all([
    prisma.cashBook.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.cashBook.count({ where }),
  ]);

  let cashTotal = 0;
  let upiTotal = 0;
  let cardTotal = 0;
  let creditTotal = 0;

  const formattedData = cashBooks.map((entry) => {
    const cash = Number(entry.cashSales);
    const upi = Number(entry.upiReceipts);
    const card = Number(entry.cardReceipts);
    const credit = Number(entry.creditSales || 0);
    const total = cash + upi + card + credit;

    cashTotal += cash;
    upiTotal += upi;
    cardTotal += card;
    creditTotal += credit;

    return {
      id: entry.id,
      date: entry.date,
      cashSales: cash,
      upiSales: upi,
      cardSales: card,
      creditSales: credit,
      totalRevenue: total,
    };
  });

  const totalMonthlyRevenue = cashTotal + upiTotal + cardTotal + creditTotal;
  const digitalRevenue = upiTotal + cardTotal;
  const daysCount = formattedData.length || 1;
  const avgDailyRevenue = Math.round(totalMonthlyRevenue / daysCount);

  // Chart datasets
  const dailyRevenueTrend = [...formattedData].reverse().map((d) => ({
    date: d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '',
    totalRevenue: d.totalRevenue,
    cashSales: d.cashSales,
    digitalSales: d.upiSales + d.cardSales,
  }));

  const cashVsDigital = [
    { name: 'Cash Sales', value: cashTotal, fill: '#10b981' },
    { name: 'Digital Sales (UPI & Card)', value: digitalRevenue, fill: '#3b82f6' },
    { name: 'Credit Sales', value: creditTotal, fill: '#f59e0b' },
  ];

  return {
    summary: {
      monthlyRevenue: totalMonthlyRevenue,
      cashRevenue: cashTotal,
      digitalRevenue,
      avgDailyRevenue,
    },
    charts: {
      dailyRevenueTrend,
      cashVsDigital,
    },
    data: formattedData,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

module.exports = {
  getKPIs,
  getSalesTrend,
  getExpenseTrend,
  getExpenseByCategory,
  getExpenseHistory,
  getCashHistory,
  getBankHistory,
  getRevenueHistory,
};

