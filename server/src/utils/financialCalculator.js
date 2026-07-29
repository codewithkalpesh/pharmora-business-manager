const toNumber = (value) => Number(value || 0);

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const calcSummary = ({
  cashSales,
  upiSales,
  bankSales,
  creditSales,
  totalIncome,
  totalExpenses,
  totalPurchases,
  distributorPayments,
  cashReceived,
  cashPaid,
  openingCash,
  closingCash,
  openingBank,
  closingBank,
}) => {
  const netProfit = toNumber(totalIncome) - toNumber(totalExpenses);
  const netCashFlow = toNumber(cashReceived) - toNumber(cashPaid);
  const purchasePercentage = toNumber(totalIncome) === 0
    ? 0
    : (toNumber(totalPurchases) / toNumber(totalIncome)) * 100;
  const expensePercentage = toNumber(totalIncome) === 0
    ? 0
    : (toNumber(totalExpenses) / toNumber(totalIncome)) * 100;
  const profitMargin = toNumber(totalIncome) === 0 ? 0 : (netProfit / toNumber(totalIncome)) * 100;

  return {
    netProfit,
    netCashFlow,
    purchasePercentage,
    expensePercentage,
    profitMargin,
    formatted: {
      netProfit: formatCurrency(netProfit),
      netCashFlow: formatCurrency(netCashFlow),
      purchasePercentage: `${purchasePercentage.toFixed(2)}%`,
      expensePercentage: `${expensePercentage.toFixed(2)}%`,
      profitMargin: `${profitMargin.toFixed(2)}%`,
    },
  };
};

const shrink = (value) => Number(value || 0).toFixed(2);

module.exports = {
  formatCurrency,
  calcSummary,
  toNumber,
  shrink,
};