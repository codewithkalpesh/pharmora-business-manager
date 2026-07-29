const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { buildLineChart, buildBarChart, buildPieChart } = require('./chartGenerator');
const { generateReportPdf } = require('./pdfGenerator');
const telegramService = require('./telegramService');
const { formatCurrency, calcSummary, toNumber } = require('../utils/financialCalculator');

const REPORT_DIRECTORY = path.join(__dirname, '../../uploads/reports');

const ensureReportDirectory = () => {
  if (!fs.existsSync(REPORT_DIRECTORY)) {
    fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });
  }
};

const getMonthBounds = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildSummary = async (userId, start, end) => {
  const [cashBooks, expenses, purchaseBills, distributorPayments, creditCollections, bankTransactions] = await Promise.all([
    prisma.cashBook.findMany({
      where: { createdById: userId, date: { gte: start, lte: end } },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { createdById: userId, date: { gte: start, lte: end } },
      include: { category: true, createdBy: true },
    }),
    prisma.purchaseBill.findMany({
      where: { createdById: userId, billDate: { gte: start, lte: end } },
      include: { supplier: true, createdBy: true },
    }),
    prisma.distributorPayment.findMany({
      where: { createdById: userId, paymentDate: { gte: start, lte: end } },
      include: { distributor: true, createdBy: true },
    }),
    prisma.creditCollection.findMany({
      where: { createdById: userId, collectionDate: { gte: start, lte: end } },
      include: { customer: true, createdBy: true },
    }),
    prisma.bankTransaction.findMany({
      where: { createdById: userId, date: { gte: start, lte: end } },
      include: { account: true, createdBy: true },
    }),
  ]);

  const cashSales = cashBooks.reduce((sum, row) => sum + toNumber(row.cashSales), 0);
  const upiSales = cashBooks.reduce((sum, row) => sum + toNumber(row.upiReceipts), 0);
  const bankSales = cashBooks.reduce((sum, row) => sum + toNumber(row.cardReceipts), 0);
  const creditSales = cashBooks.reduce((sum, row) => sum + toNumber(row.otherIncome), 0);
  const totalIncome = cashSales + upiSales + bankSales + creditSales;
  const totalExpenses = expenses.reduce((sum, row) => sum + toNumber(row.amount), 0) + distributorPayments.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const totalPurchases = purchaseBills.reduce((sum, row) => sum + toNumber(row.grandTotal), 0);
  const distributorPaymentsTotal = distributorPayments.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const cashReceived = creditCollections.reduce((sum, row) => sum + toNumber(row.amount), 0) + upiSales + cashSales + bankSales + creditSales;
  const cashPaid = expenses.filter((row) => row.paymentMode === 'CASH').reduce((sum, row) => sum + toNumber(row.amount), 0) + distributorPayments.filter((row) => row.paymentMode === 'CASH').reduce((sum, row) => sum + toNumber(row.amount), 0);

  const orderedBankTransactions = bankTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  const openingBank = orderedBankTransactions.length ? toNumber(orderedBankTransactions[0].runningBalance) - toNumber(orderedBankTransactions[0].amount) * (orderedBankTransactions[0].type === 'DEPOSIT' ? 1 : -1) : 0;
  const closingBank = orderedBankTransactions.length ? toNumber(orderedBankTransactions[orderedBankTransactions.length - 1].runningBalance) : 0;

  const openingCash = cashBooks.length ? toNumber(cashBooks[0].openingCash) : 0;
  const closingCash = cashBooks.length ? toNumber(cashBooks[cashBooks.length - 1].closingCash) : 0;

  const totalTransactions = cashBooks.length + expenses.length + purchaseBills.length + distributorPayments.length + creditCollections.length + bankTransactions.length;
  const totalSales = totalIncome;

  return {
    cashSales,
    upiSales,
    bankSales,
    creditSales,
    totalSales,
    totalIncome,
    totalExpenses,
    totalPurchases,
    distributorPayments: distributorPaymentsTotal,
    cashReceived,
    cashPaid,
    openingCash,
    closingCash,
    openingBank,
    closingBank,
    totalTransactions,
  };
};

const buildDaySummary = async (userId, start, end) => {
  const days = [];
  const dayCount = end.getDate();
  const cashBooks = await prisma.cashBook.findMany({
    where: { createdById: userId, date: { gte: start, lte: end } },
    include: { createdBy: true },
  });
  const expenses = await prisma.expense.findMany({
    where: { createdById: userId, date: { gte: start, lte: end } },
    include: { category: true, createdBy: true },
  });
  const purchaseBills = await prisma.purchaseBill.findMany({
    where: { createdById: userId, billDate: { gte: start, lte: end } },
    include: { supplier: true, createdBy: true },
  });
  const distributorPayments = await prisma.distributorPayment.findMany({
    where: { createdById: userId, paymentDate: { gte: start, lte: end } },
    include: { distributor: true, createdBy: true },
  });
  const creditCollections = await prisma.creditCollection.findMany({
    where: { createdById: userId, collectionDate: { gte: start, lte: end } },
    include: { customer: true, createdBy: true },
  });
  const bankTransactions = await prisma.bankTransaction.findMany({
    where: { createdById: userId, date: { gte: start, lte: end } },
    include: { account: true, createdBy: true },
  });

  for (let day = 1; day <= dayCount; day += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), day);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const cashBook = cashBooks.find((row) => row.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
    const dayExpenses = expenses.filter((row) => row.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
    const dayPurchases = purchaseBills.filter((row) => row.billDate.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
    const dayDistributorPayments = distributorPayments.filter((row) => row.paymentDate.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
    const dayCollections = creditCollections.filter((row) => row.collectionDate.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));
    const dayBankTxns = bankTransactions.filter((row) => row.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10));

    const cashSales = cashBook ? toNumber(cashBook.cashSales) : 0;
    const upiSales = cashBook ? toNumber(cashBook.upiReceipts) : 0;
    const bankSales = cashBook ? toNumber(cashBook.cardReceipts) : 0;
    const creditSales = cashBook ? toNumber(cashBook.otherIncome) : 0;
    const totalSales = cashSales + upiSales + bankSales + creditSales;
    const income = totalSales + dayCollections.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const expense = dayExpenses.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const purchases = dayPurchases.reduce((sum, row) => sum + toNumber(row.grandTotal), 0);
    const distributorPaymentsTotal = dayDistributorPayments.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const cashIn = cashSales + upiSales + bankSales + creditSales + dayCollections.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const cashOut = expense + distributorPaymentsTotal;
    const openingCash = cashBook ? toNumber(cashBook.openingCash) : 0;
    const closingCash = cashBook ? toNumber(cashBook.closingCash) : 0;
    const runningBank = dayBankTxns.length ? toNumber(dayBankTxns[dayBankTxns.length - 1].runningBalance) : 0;

    days.push({
      date: date.toISOString().slice(0, 10),
      cashSales,
      upiSales,
      bankSales,
      creditSales,
      totalSales,
      income,
      expense,
      purchases,
      distributorPayments: distributorPaymentsTotal,
      cashIn,
      cashOut,
      openingCash,
      closingCash,
      runningBank,
      isWeekend,
    });
  }

  return days;
};

const buildTransactionTimeline = async (userId, start, end) => {
  const [cashBooks, expenses, purchaseBills, distributorPayments, creditCollections, bankTransactions] = await Promise.all([
    prisma.cashBook.findMany({ where: { createdById: userId, date: { gte: start, lte: end } }, include: { createdBy: true } }),
    prisma.expense.findMany({ where: { createdById: userId, date: { gte: start, lte: end } }, include: { category: true, createdBy: true } }),
    prisma.purchaseBill.findMany({ where: { createdById: userId, billDate: { gte: start, lte: end } }, include: { supplier: true, createdBy: true } }),
    prisma.distributorPayment.findMany({ where: { createdById: userId, paymentDate: { gte: start, lte: end } }, include: { distributor: true, createdBy: true } }),
    prisma.creditCollection.findMany({ where: { createdById: userId, collectionDate: { gte: start, lte: end } }, include: { customer: true, createdBy: true } }),
    prisma.bankTransaction.findMany({ where: { createdById: userId, date: { gte: start, lte: end } }, include: { account: true, createdBy: true } }),
  ]);

  const timeline = [];

  cashBooks.forEach((entry) => {
    timeline.push({
      date: entry.date.toISOString().slice(0, 10),
      time: entry.createdAt.toISOString().slice(11, 16),
      type: 'Cash Book',
      category: 'CashBook Entry',
      description: entry.notes || 'Cash book summary',
      paymentMode: 'CASH',
      referenceNo: '-',
      moneyIn: toNumber(entry.closingCash) - toNumber(entry.openingCash),
      moneyOut: 0,
      runningCash: toNumber(entry.closingCash),
      runningBank: 0,
      createdBy: entry.createdById,
      sortKey: entry.createdAt,
    });
  });

  expenses.forEach((expense) => {
    timeline.push({
      date: expense.date.toISOString().slice(0, 10),
      time: expense.createdAt.toISOString().slice(11, 16),
      type: 'Expense',
      category: expense.category?.name || 'Expense',
      description: expense.description,
      paymentMode: expense.paymentMode,
      referenceNo: expense.receiptUrl || '-',
      moneyIn: 0,
      moneyOut: toNumber(expense.amount),
      runningCash: 0,
      runningBank: 0,
      createdBy: expense.createdById,
      sortKey: expense.createdAt,
    });
  });

  purchaseBills.forEach((bill) => {
    timeline.push({
      date: bill.billDate.toISOString().slice(0, 10),
      time: bill.createdAt.toISOString().slice(11, 16),
      type: 'Purchase',
      category: bill.supplier?.name || 'Supplier Purchase',
      description: bill.notes || `Purchase invoice ${bill.invoiceNo || ''}`.trim(),
      paymentMode: 'BILL',
      referenceNo: bill.invoiceNo || '-',
      moneyIn: 0,
      moneyOut: toNumber(bill.grandTotal),
      runningCash: 0,
      runningBank: 0,
      createdBy: bill.createdById,
      sortKey: bill.createdAt,
    });
  });

  distributorPayments.forEach((payment) => {
    timeline.push({
      date: payment.paymentDate.toISOString().slice(0, 10),
      time: payment.createdAt.toISOString().slice(11, 16),
      type: 'Distributor Payment',
      category: payment.distributor?.name || 'Distributor Payment',
      description: payment.notes || 'Supplier settlement',
      paymentMode: payment.paymentMode,
      referenceNo: payment.referenceNo || '-',
      moneyIn: 0,
      moneyOut: toNumber(payment.amount),
      runningCash: 0,
      runningBank: 0,
      createdBy: payment.createdById,
      sortKey: payment.createdAt,
    });
  });

  creditCollections.forEach((collection) => {
    timeline.push({
      date: collection.collectionDate.toISOString().slice(0, 10),
      time: collection.createdAt.toISOString().slice(11, 16),
      type: 'Credit Collection',
      category: collection.customer?.name || 'Customer Collection',
      description: collection.notes || 'Customer credit collected',
      paymentMode: collection.paymentMode,
      referenceNo: collection.referenceNo || '-',
      moneyIn: toNumber(collection.amount),
      moneyOut: 0,
      runningCash: 0,
      runningBank: 0,
      createdBy: collection.createdById,
      sortKey: collection.createdAt,
    });
  });

  bankTransactions.forEach((txn) => {
    timeline.push({
      date: txn.date.toISOString().slice(0, 10),
      time: txn.createdAt.toISOString().slice(11, 16),
      type: txn.type === 'DEPOSIT' ? 'Bank Deposit' : 'Bank Withdrawal',
      category: txn.account?.bankName || 'Bank Transaction',
      description: txn.description,
      paymentMode: txn.type,
      referenceNo: txn.referenceNo || '-',
      moneyIn: txn.type === 'DEPOSIT' ? toNumber(txn.amount) : 0,
      moneyOut: txn.type === 'WITHDRAWAL' ? toNumber(txn.amount) : 0,
      runningCash: 0,
      runningBank: toNumber(txn.runningBalance),
      createdBy: txn.createdById,
      sortKey: txn.createdAt,
    });
  });

  return timeline.sort((a, b) => new Date(a.sortKey) - new Date(b.sortKey));
};

const calculateAnalysis = (daySummary, summary) => {
  const highestSalesDay = daySummary.reduce((best, row) => (row.totalSales > best.totalSales ? row : best), daySummary[0] || { totalSales: 0 });
  const lowestSalesDay = daySummary.reduce((best, row) => (row.totalSales < best.totalSales ? row : best), daySummary[0] || { totalSales: 0 });
  const highestExpenseDay = daySummary.reduce((best, row) => (row.expense > best.expense ? row : best), daySummary[0] || { expense: 0 });
  const averageDailySales = daySummary.length ? daySummary.reduce((sum, row) => sum + row.totalSales, 0) / daySummary.length : 0;
  const averageDailyExpense = daySummary.length ? daySummary.reduce((sum, row) => sum + row.expense, 0) / daySummary.length : 0;

  return {
    highestSalesDay: highestSalesDay.date || '-',
    lowestSalesDay: lowestSalesDay.date || '-',
    highestExpenseDay: highestExpenseDay.date || '-',
    averageDailySales,
    averageDailyExpense,
    totalCashReceived: summary.cashReceived,
    totalCashPaid: summary.cashPaid,
    purchasePercentage: calcSummary(summary).formatted.purchasePercentage,
    expensePercentage: calcSummary(summary).formatted.expensePercentage,
    netProfit: calcSummary(summary).netProfit,
    profitMargin: calcSummary(summary).formatted.profitMargin,
  };
};

const generateReport = async ({ month, year, userId, sendTelegram = true }) => {
  ensureReportDirectory();

  const { start, end } = getMonthBounds(month, year);
  const monthLabel = `${start.toLocaleString('en-IN', { month: 'long' })} ${year}`;
  const reportNumber = `REPORT-${year}-${String(month).padStart(2, '0')}-001`;
  const generatedAt = new Date().toLocaleDateString('en-GB');

  const summary = await buildSummary(userId, start, end);
  const daySummary = await buildDaySummary(userId, start, end);
  const transactions = await buildTransactionTimeline(userId, start, end);

  const summaryAnalysis = calculateAnalysis(daySummary, summary);

  const dayLabels = daySummary.map((row) => row.date.slice(-2));
  const dailySalesValues = daySummary.map((row) => row.totalSales);
  const dailyExpenseValues = daySummary.map((row) => row.expense);
  const paymentMethodValues = [summary.cashSales, summary.upiSales, summary.bankSales, summary.creditSales];

  const charts = {
    dailySales: await buildLineChart(dayLabels, dailySalesValues, 'Daily Sales'),
    dailyExpenses: await buildBarChart(dayLabels, dailyExpenseValues, 'Daily Expenses'),
    paymentMethods: await buildPieChart(['Cash', 'UPI', 'Bank', 'Credit'], paymentMethodValues, 'Payment Methods'),
  };

  const fileName = `${start.toLocaleString('en-IN', { month: 'long' })}-${year}-Report.pdf`;
  const outputPath = path.join(REPORT_DIRECTORY, fileName);

  await generateReportPdf({
    monthLabel,
    reportMonth: month,
    generatedAt,
    summary: { ...summary, ...calcSummary(summary) },
    daySummary,
    transactions,
    analysis: summaryAnalysis,
    charts,
    reportNumber,
    outputPath,
  });

  if (sendTelegram) {
    const message = `📊 *Pharmora Monthly Report*\n\nMonth: ${monthLabel}\n\nTotal Sales: ${formatCurrency(summary.totalIncome)}\nTotal Expense: ${formatCurrency(summary.totalExpenses)}\nNet Profit: ${formatCurrency(summary.netProfit)}\n\nSee attached PDF.`;
    await telegramService.sendMessage(message);
    await telegramService.sendDocument(outputPath, `Monthly report for ${monthLabel}`);
  }

  return { fileName, outputPath, monthLabel, reportNumber };
};

module.exports = {
  generateReport,
  getMonthBounds,
};