const { theme, sectionStyles } = require('./theme');
const { formatCurrency, formatPercent } = require('./utils');

const buildKpiCards = (summary) => [
  { icon: '💰', title: 'Total Sales', value: formatCurrency(summary.totalSales), color: theme.primary },
  { icon: '📈', title: 'Net Profit', value: formatCurrency(summary.netProfit), color: theme.success },
  { icon: '🧾', title: 'Expenses', value: formatCurrency(summary.totalExpenses), color: theme.danger },
  { icon: '📦', title: 'Purchases', value: formatCurrency(summary.totalPurchases), color: theme.warning },
  { icon: '🏦', title: 'Bank Balance', value: formatCurrency(summary.closingBank), color: theme.primary },
  { icon: '💵', title: 'Cash Balance', value: formatCurrency(summary.closingCash), color: theme.success },
  { icon: '💳', title: 'Distributor Payments', value: formatCurrency(summary.distributorPayments), color: theme.danger },
  { icon: '📊', title: 'Total Transactions', value: String(summary.totalTransactions), color: theme.accent },
];

const buildAnalysisCards = (analysis) => [
  { icon: '📅', title: 'Highest Sales Day', value: analysis.highestSalesDay, color: theme.primary },
  { icon: '🔥', title: 'Highest Expense Day', value: analysis.highestExpenseDay, color: theme.danger },
  { icon: '❄️', title: 'Lowest Sales Day', value: analysis.lowestSalesDay, color: theme.accent },
  { icon: '📈', title: 'Average Daily Sales', value: formatCurrency(analysis.averageDailySales), color: theme.success },
  { icon: '📉', title: 'Average Daily Expense', value: formatCurrency(analysis.averageDailyExpense), color: theme.warning },
  { icon: '💹', title: 'Profit Margin', value: formatPercent(analysis.profitMargin), color: theme.primary },
  { icon: '📦', title: 'Purchase %', value: formatPercent(analysis.purchasePercentage), color: theme.danger },
  { icon: '🧾', title: 'Expense %', value: formatPercent(analysis.expensePercentage), color: theme.warning },
  { icon: '💰', title: 'Net Cash Flow', value: formatCurrency(analysis.netCashFlow), color: theme.success },
];

module.exports = {
  buildKpiCards,
  buildAnalysisCards,
};
