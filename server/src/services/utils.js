const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `₹${number.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMonthYear = (month, year) => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const toDataUrl = (buffer) => `data:image/png;base64,${buffer.toString('base64')}`;

const safeNumber = (value) => Number(value || 0);

const groupBy = (list, keyFn) => list.reduce((acc, item) => {
  const key = keyFn(item);
  acc[key] = acc[key] || [];
  acc[key].push(item);
  return acc;
}, {});

module.exports = {
  formatCurrency,
  formatPercent,
  formatDate,
  formatMonthYear,
  toDataUrl,
  safeNumber,
  groupBy,
};
