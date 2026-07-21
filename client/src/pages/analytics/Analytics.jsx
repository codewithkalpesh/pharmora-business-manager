// src/pages/analytics/Analytics.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, RefreshCw, Landmark, Users, Truck,
  ArrowUpDown, PiggyBank, PieChart as PieIcon, BarChart3,
  Calendar, Info,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { analyticsApi } from '../../api/analytics.api';
import { formatCurrency } from '../../lib/utils';

export function Analytics() {
  const [months, setMonths] = useState(6);

  // Fetch all analytics datasets
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['analytics-trend', months],
    queryFn: () => analyticsApi.getRevenueVsExpenses({ months }).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['analytics-breakdown', months],
    queryFn: () => analyticsApi.getExpenseBreakdown({ months }).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: modesData, isLoading: modesLoading } = useQuery({
    queryKey: ['analytics-modes', months],
    queryFn: () => analyticsApi.getPaymentModes({ months }).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: distributorsData } = useQuery({
    queryKey: ['analytics-distributors'],
    queryFn: () => analyticsApi.getTopDistributors({ limit: 5 }).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: bankData } = useQuery({
    queryKey: ['analytics-banks'],
    queryFn: () => analyticsApi.getBankSummary().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: customerData } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: () => analyticsApi.getCustomerCredit().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const refetchAll = () => {
    window.location.reload();
  };

  const summary = summaryData || {};
  const revenueTrend = trendData || [];
  const categoryBreakdown = breakdownData || [];
  const paymentModes = modesData || [];
  const topDistributors = distributorsData || [];
  const bankSummary = bankData || [];
  const customerCredit = customerData || [];

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
        {payload.map((p, idx) => (
          <p key={idx} style={{ fontSize: '0.8125rem', fontWeight: 600, color: p.color || p.fill }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: data.color || 'var(--text-primary)' }}>
          {data.name || data.category || data.mode}: {formatCurrency(data.value || data.amount)}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Share: {data.percentage}%
        </p>
      </div>
    );
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Business Analytics"
        subtitle="Richer visual data insights, performance metrics, and asset breakdowns"
        actions={
          <div className="flex gap-2">
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={refetchAll}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI Section */}
      {!summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            label="Profit Margin"
            value={Number(summary.profitMargin || 0)}
            format="percent"
            icon={PiggyBank}
            iconBg="rgba(16,185,129,0.1)"
            iconColor="#10b981"
            accentColor="#10b981"
            subtitle={`Monthly Profit: ${formatCurrency(summary.thisMonthProfit || 0)}`}
          />
          <KPICard
            label="Revenue Trend"
            value={Number(summary.thisMonthRevenue || 0)}
            icon={TrendingUp}
            iconBg="rgba(59,130,246,0.1)"
            iconColor="#3b82f6"
            accentColor="#3b82f6"
            trend={summary.revenueChange}
            trendLabel="vs last month"
          />
          <KPICard
            label="Expenses Trend"
            value={Number(summary.thisMonthExpenses || 0)}
            icon={ArrowUpDown}
            iconBg="rgba(239,68,68,0.1)"
            iconColor="#ef4444"
            accentColor="#ef4444"
            trend={summary.expenseChange}
            trendLabel="vs last month"
          />
          <KPICard
            label="Outstanding Dues"
            value={Number(summary.totalCustomerOutstanding || 0)}
            icon={Users}
            iconBg="rgba(139,92,246,0.1)"
            iconColor="#8b5cf6"
            accentColor="#8b5cf6"
            subtitle={`Distributor Payable: ${formatCurrency(summary.totalDistributorPending || 0)}`}
          />
        </div>
      )}

      {/* Revenue vs Expenses Chart */}
      <div className="card p-5 border border-slate-800 bg-slate-900/40">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-450" />
              Revenue vs Expenses Trend
            </h3>
            <p className="text-[11px] text-slate-450 mt-1">Comparing total sales inflows vs operating cost outflows</p>
          </div>
        </div>
        <div className="h-[280px]">
          {trendLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 mr-2" /> Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Double Column Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="card p-5 border border-slate-800 bg-slate-900/40">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-450" />
              Expense Distribution By Category
            </h3>
            <p className="text-[11px] text-slate-450 mt-1">Largest segments of business spending</p>
          </div>
          <div className="h-[220px] flex items-center">
            {breakdownLoading ? (
              <div className="flex items-center justify-center w-full text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full text-slate-500">
                <Info size={24} className="mb-2" />
                <p className="text-xs">No expense data found</p>
              </div>
            ) : (
              <>
                <div className="w-[50%] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-[50%] max-h-full overflow-y-auto space-y-2 pr-2">
                  {categoryBreakdown.slice(0, 5).map((cat, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-300 truncate font-medium">{cat.category}</span>
                      </div>
                      <span className="text-slate-400 font-bold shrink-0">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Modes */}
        <div className="card p-5 border border-slate-800 bg-slate-900/40">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-450" />
              Payment Methods Analysis
            </h3>
            <p className="text-[11px] text-slate-450 mt-1">Distribution of transaction settlement formats</p>
          </div>
          <div className="h-[220px] flex items-center">
            {modesLoading ? (
              <div className="flex items-center justify-center w-full text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            ) : paymentModes.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full text-slate-500">
                <Info size={24} className="mb-2" />
                <p className="text-xs">No transaction settlement records</p>
              </div>
            ) : (
              <>
                <div className="w-[50%] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentModes}
                        dataKey="amount"
                        nameKey="mode"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {paymentModes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-[50%] space-y-2">
                  {paymentModes.map((mode, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: mode.color }} />
                        <span className="text-slate-300 font-medium">{mode.mode}</span>
                      </div>
                      <span className="text-slate-400 font-bold">{mode.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Breakdowns & Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bank summary list */}
        <div className="card p-5 border border-slate-800 bg-slate-900/40 md:col-span-1">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-450" />
            Bank Asset Health
          </h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {bankSummary.length === 0 ? (
              <p className="text-xs text-slate-500">No bank accounts added.</p>
            ) : (
              bankSummary.map((b, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                  <div className="text-xs text-slate-300 font-bold truncate">{b.name}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(b.currentBalance)}</span>
                    <span className={`text-[10px] font-bold ${b.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {b.change >= 0 ? '+' : ''}{formatCurrency(b.change)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top debtors / customers */}
        <div className="card p-5 border border-slate-800 bg-slate-900/40 md:col-span-1">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-450" />
            Outstanding Receivables
          </h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {customerCredit.length === 0 ? (
              <p className="text-xs text-slate-500">No outstanding customer credits.</p>
            ) : (
              customerCredit.map((c, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-300 font-bold">{c.name}</div>
                    {c.phone && <div className="text-[10px] text-slate-500 mt-0.5">{c.phone}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-purple-400">{formatCurrency(c.outstanding)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Total: {formatCurrency(c.total)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top distributors spend */}
        <div className="card p-5 border border-slate-800 bg-slate-900/40 md:col-span-1">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-450" />
            Top Distributor Spend
          </h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {topDistributors.length === 0 ? (
              <p className="text-xs text-slate-500">No supplier spend logs yet.</p>
            ) : (
              topDistributors.map((d, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex justify-between items-center">
                  <div className="text-xs text-slate-300 font-bold truncate pr-2">{d.name}</div>
                  <span className="text-xs font-bold text-slate-100 shrink-0">{formatCurrency(d.totalSpend)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
