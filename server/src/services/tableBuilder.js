const { theme } = require('./theme');

const buildTableLayout = () => ({
  fillColor: (rowIndex) => (rowIndex === 0 ? theme.primary : rowIndex % 2 === 0 ? '#F8FAFC' : '#FFFFFF'),
  hLineColor: theme.border,
  vLineColor: theme.border,
  hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
  vLineWidth: () => 0.5,
  paddingLeft: () => 6,
  paddingRight: () => 6,
  paddingTop: () => 6,
  paddingBottom: () => 6,
});

module.exports = {
  buildTableLayout,
};
