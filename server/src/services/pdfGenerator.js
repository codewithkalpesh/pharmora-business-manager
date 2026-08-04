const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake/src/printer');
const { theme } = require('./theme');
const { buildKpiCards, buildAnalysisCards } = require('./summaryBuilder');
const { buildTableLayout } = require('./tableBuilder');
const { formatCurrency } = require('../utils/financialCalculator');
const { formatDate } = require('./utils');

// Try a list of common font families / locations so the server can run
// across Windows and Linux hosts (Render, Docker, etc.). We pick the
// first complete font set found.
const fontCandidates = [
  // Windows Arial
  {
    name: 'Arial',
    normal: path.join(process.env.SystemRoot || 'C:\\Windows', 'Fonts', 'arial.ttf'),
    bold: path.join(process.env.SystemRoot || 'C:\\Windows', 'Fonts', 'arialbd.ttf'),
    italics: path.join(process.env.SystemRoot || 'C:\\Windows', 'Fonts', 'ariali.ttf'),
    bolditalics: path.join(process.env.SystemRoot || 'C:\\Windows', 'Fonts', 'arialbi.ttf'),
  },
  // DejaVu (common on many Linux images)
  {
    name: 'DejaVuSans',
    normal: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    italics: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf',
    bolditalics: '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf',
  },
  // Liberation (alternative Linux fonts)
  {
    name: 'LiberationSans',
    normal: '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    bold: '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    italics: '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
    bolditalics: '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf',
  },
];

let chosenFont = null;
for (const candidate of fontCandidates) {
  const allExist = ['normal', 'bold', 'italics', 'bolditalics'].every((k) => fs.existsSync(candidate[k]));
  if (allExist) {
    chosenFont = candidate;
    break;
  }
}

if (!chosenFont) {
  // Nothing found — provide a clearer error listing tried locations.
  const tried = fontCandidates
    .map((c) => `- ${c.name}: ${c.normal}`)
    .join('\n');
  throw new Error(
    `No usable system fonts found for PDF generation. Tried:\n${tried}\nPlease install DejaVu/Liberation fonts on the host or include a TTF bundle in the project.`,
  );
}

const fonts = {
  [chosenFont.name]: {
    normal: chosenFont.normal,
    bold: chosenFont.bold,
    italics: chosenFont.italics,
    bolditalics: chosenFont.bolditalics,
  },
};

const printer = new PdfPrinter(fonts);

const buildSectionHeader = (title, subtitle) => ([
  { text: title, style: 'sectionTitle' },
  { text: subtitle, style: 'sectionSubtitle' },
]);

const buildMetricCards = (cards, columns = 2) => {
  const rows = [];
  for (let i = 0; i < cards.length; i += columns) {
    const row = cards.slice(i, i + columns).map((card) => ({
      stack: [
        { text: card.icon, fontSize: 20, color: card.color, margin: [0, 0, 0, 4] },
        { text: card.title, style: 'cardTitle' },
        { text: card.value, style: 'cardValue' },
      ],
      fillColor: '#ffffff',
      margin: [0, 0, 12, 12],
      border: [false, false, false, false],
      layout: 'noBorders',
    }));

    while (row.length < columns) {
      row.push({ text: '', border: [false, false, false, false], layout: 'noBorders' });
    }

    rows.push(row);
  }

  return {
    table: {
      widths: Array(columns).fill('*'),
      body: rows,
    },
    layout: {
      defaultBorder: false,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
    },
    margin: [0, 0, 0, 16],
  };
};

const buildTable = (headers, rows, widths) => ({
  table: {
    headerRows: 1,
    widths,
    body: [headers, ...rows],
  },
  layout: buildTableLayout(),
  style: 'table',
  margin: [0, 0, 0, 20],
});

const buildDaySummaryRows = (daySummary) => daySummary.map((day) => [
  { text: formatDate(day.date), style: 'tableCell' },
  { text: formatCurrency(day.totalSales), style: 'tableCell', alignment: 'right' },
  { text: formatCurrency(day.income), style: 'tableCell', alignment: 'right' },
  { text: formatCurrency(day.expense), style: 'tableCell', alignment: 'right' },
  { text: formatCurrency(day.purchases), style: 'tableCell', alignment: 'right' },
  { text: formatCurrency(day.closingCash), style: 'tableCell', alignment: 'right' },
]);

const buildTransactionRows = (transactions) => transactions.map((txn) => [
  { text: txn.time || '', style: 'tableCell' },
  { text: txn.type, style: 'tableCell' },
  { text: txn.category, style: 'tableCell' },
  { text: txn.description, style: 'tableCell' },
  { text: txn.moneyIn ? formatCurrency(txn.moneyIn) : '-', style: 'tableCell', alignment: 'right' },
  { text: txn.moneyOut ? formatCurrency(txn.moneyOut) : '-', style: 'tableCell', alignment: 'right' },
  { text: txn.runningBank ? formatCurrency(txn.runningBank) : '-', style: 'tableCell', alignment: 'right' },
]);

const buildAnalyticsBullets = (analysis) => ({
  ul: [
    `Highest sales day: ${analysis.highestSalesDay}.`,
    `Lowest sales day: ${analysis.lowestSalesDay}.`,
    `Total cash received: ${formatCurrency(analysis.totalCashReceived)} with ${formatCurrency(analysis.totalCashPaid)} paid out.`,
    `Profit margin: ${analysis.profitMargin}.`,
    `Purchases were ${analysis.purchasePercentage} of total income.`,
  ],
  style: 'bulletText',
  margin: [0, 0, 0, 16],
});

const createDocDefinition = ({ monthLabel, generatedAt, summary, daySummary, transactions, groupedTransactions, analysis, charts, reportNumber }) => {
  const kpiCards = buildKpiCards(summary);
  const analysisCards = buildAnalysisCards(analysis);
  const dayRows = buildDaySummaryRows(daySummary);
  const totalTxCount = (groupedTransactions || []).reduce((s, g) => s + (g.transactions?.length || 0), 0);

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Generated by Pharmora Business Manager', style: 'footerText' },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', style: 'footerText' },
      ],
      margin: [40, 0, 40, 0],
    }),
    background: (currentPage) => ({
      canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: theme.background }],
    }),
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'PHARMORA BUSINESS MANAGER', style: 'coverLogo' },
              { text: 'Monthly Financial Report', style: 'coverSubtitle' },
              { text: monthLabel, style: 'coverTitle' },
              { text: `Report No. ${reportNumber}`, style: 'coverMeta' },
              { text: `Generated on ${generatedAt}`, style: 'coverMeta' },
              { text: 'This report provides a premium executive view of monthly performance, cash flow, expenses, and transaction insights.', style: 'coverNote' },
            ],
          },
          {
            width: 'auto',
            stack: [
              {
                table: {
                  widths: ['*'],
                  body: [
                    [{ text: 'Highlights', style: 'coverPanelTitle', fillColor: theme.primary, color: '#ffffff', margin: [8, 8, 8, 8] }],
                    [{ text: `Total Sales\n${formatCurrency(summary.totalSales)}`, style: 'coverPanelValue', margin: [8, 8, 8, 8] }],
                    [{ text: `Net Profit\n${formatCurrency(summary.netProfit)}`, style: 'coverPanelValue', margin: [8, 8, 8, 8] }],
                    [{ text: `Closing Cash\n${formatCurrency(summary.closingCash)}`, style: 'coverPanelValue', margin: [8, 8, 8, 8] }],
                  ],
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                },
                margin: [0, 40, 0, 0],
              },
            ],
          },
        ],
      },
      { text: '', pageBreak: 'after' },
      ...buildSectionHeader('Executive Summary', 'High-level performance and growth indicators.'),
      buildMetricCards(kpiCards, 2),
      buildMetricCards(analysisCards, 3),
      { text: '', pageBreak: 'after' },
      ...buildSectionHeader('Operational Snapshot', 'Daily revenue, expense, and cash closings.'),
      buildTable(
        [
          { text: 'Date', style: 'tableHeader' },
          { text: 'Sales', style: 'tableHeader', alignment: 'right' },
          { text: 'Income', style: 'tableHeader', alignment: 'right' },
          { text: 'Expense', style: 'tableHeader', alignment: 'right' },
          { text: 'Purchases', style: 'tableHeader', alignment: 'right' },
          { text: 'Close Cash', style: 'tableHeader', alignment: 'right' },
        ],
        dayRows,
        ['auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
      ),
      { text: '', pageBreak: 'after' },
      ...buildSectionHeader('Transaction Ledger', 'Date-wise transaction timeline.'),
      // Render grouped transactions by date
      ...(
        (transactions || []).map((group) => {
          const dayRows = buildTransactionRows(group.transactions);
          const dayTotals = group.transactions.reduce((t, tx) => {
            t.sales += tx.type === 'Sale' ? (tx.moneyIn || 0) : 0;
            t.expense += tx.type === 'Expense' ? (tx.moneyOut || 0) : 0;
            t.purchases += tx.type === 'Purchase' ? (tx.moneyOut || 0) : 0;
            t.cashIn += tx.moneyIn || 0;
            t.cashOut += tx.moneyOut || 0;
            return t;
          }, { sales: 0, expense: 0, purchases: 0, cashIn: 0, cashOut: 0 });

          return [
            { text: `📅 ${formatDate(group.date)}`, style: 'dayHeader' },
            { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 520, y2: 4, lineWidth: 0.5, lineColor: theme.border }] },
            {
              table: {
                widths: [50, 60, 90, '*', 50, 50, 60],
                body: [
                  [
                    { text: 'Time', style: 'tableHeader' },
                    { text: 'Type', style: 'tableHeader' },
                    { text: 'Category', style: 'tableHeader' },
                    { text: 'Details', style: 'tableHeader' },
                    { text: 'In', style: 'tableHeader', alignment: 'right' },
                    { text: 'Out', style: 'tableHeader', alignment: 'right' },
                    { text: 'Bank Bal', style: 'tableHeader', alignment: 'right' },
                  ],
                  ...dayRows,
                ],
              },
              layout: buildTableLayout(),
              margin: [0, 8, 0, 8],
            },
            {
              columns: [
                { width: '*', text: '' },
                {
                  width: 'auto',
                  stack: [
                    { text: 'Daily Total', style: 'dayTotalTitle' },
                    { text: `Sales ${formatCurrency(dayTotals.sales)}`, style: 'dayTotal' },
                    { text: `Expense ${formatCurrency(dayTotals.expense)}`, style: 'dayTotal' },
                    { text: `Purchases ${formatCurrency(dayTotals.purchases)}`, style: 'dayTotal' },
                    { text: `Cash In ${formatCurrency(dayTotals.cashIn)}`, style: 'dayTotal' },
                    { text: `Cash Out ${formatCurrency(dayTotals.cashOut)}`, style: 'dayTotal' },
                  ],
                },
              ],
              margin: [0, 0, 0, 12],
            },
          ];
        }).flat()
      ),
      { text: '', pageBreak: 'after' },
      ...buildSectionHeader('Financial Charts', 'Visual trends for sales, expenses, and payment mix.'),
      charts.dailySales ? { image: charts.dailySales, width: 520, alignment: 'center', margin: [0, 0, 0, 16] } : null,
      charts.dailyExpenses ? { image: charts.dailyExpenses, width: 520, alignment: 'center', margin: [0, 0, 0, 16] } : null,
      charts.paymentMethods ? { image: charts.paymentMethods, width: 360, alignment: 'center', margin: [0, 0, 0, 16] } : null,
      buildAnalyticsBullets(analysis),
    ].filter(Boolean),
    styles: {
      coverLogo: { fontSize: 24, bold: true, color: theme.primary, margin: [0, 0, 0, 8] },
      coverSubtitle: { fontSize: 11, color: theme.muted, margin: [0, 0, 0, 12] },
      coverTitle: { fontSize: 28, bold: true, color: theme.text, margin: [0, 0, 0, 8] },
      coverMeta: { fontSize: 10, color: theme.muted, margin: [0, 2, 0, 2] },
      coverNote: { fontSize: 11, color: theme.muted, margin: [0, 8, 0, 24], lineHeight: 1.5 },
      coverPanelTitle: { fontSize: 11, bold: true, color: '#ffffff', margin: [0, 4, 0, 4] },
      coverPanelValue: { fontSize: 14, bold: true, color: theme.text, margin: [0, 4, 0, 4] },
      sectionTitle: { fontSize: 18, bold: true, color: theme.primary, margin: [0, 0, 0, 4] },
      sectionSubtitle: { fontSize: 10, color: theme.muted, margin: [0, 0, 0, 16] },
      dayHeader: { fontSize: 14, bold: true, color: theme.primary, margin: [0, 8, 0, 6] },
      dayTotalTitle: { fontSize: 11, bold: true, color: theme.muted, margin: [0, 2, 0, 2] },
      dayTotal: { fontSize: 10, bold: true, color: theme.text, margin: [0, 2, 0, 2] },
      cardTitle: { fontSize: 10, bold: true, color: theme.muted, margin: [0, 2, 0, 2] },
      cardValue: { fontSize: 18, bold: true, color: theme.text, margin: [0, 2, 0, 0] },
      tableHeader: { fontSize: 9, bold: true, color: theme.text, margin: [0, 4, 0, 4] },
      tableCell: { fontSize: 8, color: theme.text, margin: [0, 2, 0, 2] },
      footerText: { fontSize: 8, color: theme.muted },
      bulletText: { fontSize: 10, color: theme.text, margin: [0, 4, 0, 4] },
      noteText: { fontSize: 9, color: theme.muted, italics: true, margin: [0, 8, 0, 16] },
    },
    defaultStyle: {
      font: chosenFont.name,
      lineHeight: 1.2,
    },
  };
};

const generateReportPdf = async ({ monthLabel, generatedAt, summary, daySummary, transactions, groupedTransactions, analysis, charts, reportNumber, outputPath }) => {
  return new Promise((resolve, reject) => {
    const docDefinition = createDocDefinition({ monthLabel, generatedAt, summary, daySummary, transactions, groupedTransactions, analysis, charts, reportNumber });
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(stream);
    pdfDoc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

module.exports = {
  generateReportPdf,
};