const theme = {
  primary: '#2563EB',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  accent: '#8B5CF6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#111827',
  muted: '#475569',
  border: '#E2E8F0',
  cardShadow: '#E5E7EB',
};

const coverStyles = {
  logoTitle: { fontSize: 22, bold: true, color: theme.primary, margin: [0, 0, 0, 4] },
  logoSubtitle: { fontSize: 10, color: theme.muted },
  coverTitle: { fontSize: 24, bold: true, color: theme.text, margin: [0, 0, 0, 6] },
  coverMeta: { fontSize: 10, color: theme.text, margin: [0, 1, 0, 1] },
  coverNote: { fontSize: 12, color: theme.muted, margin: [0, 8, 0, 24] },
};

const sectionStyles = {
  title: { fontSize: 16, bold: true, color: theme.primary, margin: [0, 10, 0, 12] },
  subtitle: { fontSize: 11, color: theme.muted, margin: [0, 0, 0, 16] },
  footer: { fontSize: 8, color: theme.muted },
  cardTitle: { fontSize: 9, color: theme.muted, margin: [0, 6, 0, 2] },
  cardValue: { fontSize: 18, bold: true, color: theme.text },
  tableHeader: { fontSize: 8, bold: true, color: theme.text },
  tableCell: { fontSize: 8, color: theme.text },
};

module.exports = {
  theme,
  coverStyles,
  sectionStyles,
};
