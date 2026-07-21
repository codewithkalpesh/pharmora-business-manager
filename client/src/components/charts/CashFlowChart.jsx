// src/components/charts/CashFlowChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { formatCurrency } from '../../lib/utils';

const MOCK_DATA = Array.from({ length: 14 }, (_, i) => {
  const income = Math.random() * 60000 + 20000;
  const expense = Math.random() * 40000 + 10000;
  return {
    date: format(subDays(new Date(), 13 - i), 'dd MMM'),
    net: +(income - expense).toFixed(0),
  };
});

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: val >= 0 ? '#10b981' : '#ef4444' }}>
        {val >= 0 ? '+' : ''}{formatCurrency(val)}
      </p>
    </div>
  );
};

export function CashFlowChart({ data = [] }) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <div className="chart-title">Net Cash Flow</div>
          <div className="chart-subtitle">Income minus expenses (last 14 days)</div>
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
            <Bar dataKey="net" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.net >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          No cash flow transactions recorded yet
        </div>
      )}
    </div>
  );
}
