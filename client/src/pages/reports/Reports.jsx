// src/pages/reports/Reports.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, TrendingUp, TrendingDown, DollarSign, Users,
  Truck, RefreshCw, BarChart3, Download, Calendar, Building2,
  ArrowUpRight, ArrowDownRight, Minus, Receipt,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { dashboardApi } from '../../api/dashboard.api';
import { expenseApi } from '../../api/expense.api';
import { purchaseApi } from '../../api/purchase.api';
import { customerApi } from '../../api/customer.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Section = ({ title, icon: Icon, iconColor = '#10b981', children, action }) => (
  <div
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${iconColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
          {title}
        </span>
      </div>
      {action}
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const StatRow = ({ label, value, valueColor = 'var(--text-primary)', highlight }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
      background: highlight ? 'rgba(16,185,129,0.04)' : 'transparent',
    }}
  >
    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: valueColor }}>{value}</span>
  </div>
);

const TableRow = ({ cells }) => (
  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
    {cells.map((cell, i) => (
      <td
        key={i}
        style={{
          padding: '10px 12px',
          fontSize: '0.8125rem',
          color: cell.color || 'var(--text-secondary)',
          textAlign: cell.align || 'left',
          fontWeight: cell.bold ? 600 : 400,
        }}
      >
        {cell.value}
      </td>
    ))}
  </tr>
);

export function Reports() {
  const now = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  const { data: kpiData, isLoading: kpisLoading, refetch } = useQuery({
    queryKey: ['reports-kpis'],
    queryFn: () => dashboardApi.getKPIs().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const { data: expenseStats } = useQuery({
    queryKey: ['reports-expense-stats', startDate, endDate],
    queryFn: () =>
      expenseApi.getStats({ startDate, endDate }).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  const { data: expenseCategories } = useQuery({
    queryKey: ['reports-expense-categories'],
    queryFn: () => expenseApi.getCategories().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: pendingPurchases } = useQuery({
    queryKey: ['reports-pending-purchases'],
    queryFn: () =>
      purchaseApi.getBills({ status: 'PENDING', limit: 50 }).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  const { data: partialPurchases } = useQuery({
    queryKey: ['reports-partial-purchases'],
    queryFn: () =>
      purchaseApi.getBills({ status: 'PARTIAL', limit: 50 }).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  const { data: customerData } = useQuery({
    queryKey: ['reports-customers'],
    queryFn: () =>
      customerApi.getCustomerStats().then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  const kpis = kpiData?.kpis || {};
  const breakdown = expenseStats?.breakdown || [];
  const totalExpenses = expenseStats?.totalAmount || 0;

  // Combine pending + partial purchase bills
  const allPendingBills = [
    ...(pendingPurchases?.bills || []),
    ...(partialPurchases?.bills || []),
  ].sort((a, b) => new Date(a.billDate) - new Date(b.billDate));

  const totalDistPending = allPendingBills.reduce(
    (sum, b) => sum + (Number(b.grandTotal) - Number(b.paidAmount)),
    0
  );

  // Customers with outstanding credit from stats
  const customersWithCredit = (customerData?.topDebtors || []);
  const totalCustOutstanding = Number(customerData?.totalOutstanding || 0);

  const monthlyRevenue = kpis.monthlyRevenue || 0;
  const monthlyExpenses = totalExpenses;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const profitMargin = monthlyRevenue > 0 ? ((monthlyProfit / monthlyRevenue) * 100).toFixed(1) : 0;

  const handlePrint = () => window.print();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Business Reports"
        subtitle="Consolidated financial summaries for P&L, expenses, receivables, and payables"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Download size={14} /> Print / Export
            </button>
          </div>
        }
      />

      {/* Date Range Filter */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          <Calendar size={15} />
          <span>Report Period:</span>
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
          style={{ width: 150, height: 34, fontSize: '0.8125rem' }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input"
          style={{ width: 150, height: 34, fontSize: '0.8125rem' }}
        />
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Expense figures update automatically based on the selected period
        </span>
      </div>

      {/* Top KPI Summary */}
      {kpisLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--brand-500)' }} />
        </div>
      ) : (
        <div className="grid-4">
          <KPICard
            label="Monthly Revenue"
            value={monthlyRevenue}
            icon={DollarSign}
            iconBg="rgba(16,185,129,0.12)"
            iconColor="#10b981"
            accentColor="#10b981"
          />
          <KPICard
            label="Monthly Expenses"
            value={monthlyExpenses}
            icon={TrendingDown}
            iconBg="rgba(239,68,68,0.1)"
            iconColor="#ef4444"
            accentColor="#ef4444"
          />
          <KPICard
            label="Net Profit"
            value={monthlyProfit}
            icon={monthlyProfit >= 0 ? TrendingUp : TrendingDown}
            iconBg={monthlyProfit >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)'}
            iconColor={monthlyProfit >= 0 ? '#10b981' : '#ef4444'}
            accentColor={monthlyProfit >= 0 ? '#10b981' : '#ef4444'}
          />
          <KPICard
            label="Profit Margin"
            value={parseFloat(profitMargin)}
            format="percent"
            icon={BarChart3}
            iconBg="rgba(139,92,246,0.1)"
            iconColor="#8b5cf6"
            accentColor="#8b5cf6"
          />
        </div>
      )}

      {/* P&L Summary */}
      <Section title="Profit & Loss Summary" icon={BarChart3} iconColor="#10b981">
        <StatRow label="Total Revenue (Month)" value={formatCurrency(monthlyRevenue)} valueColor="#10b981" />
        <StatRow label="Cash In Hand" value={formatCurrency(kpis.cashInHand || 0)} />
        <StatRow label="Bank Balance" value={formatCurrency(kpis.bankBalance || 0)} />
        <StatRow
          label="Total Operating Expenses"
          value={`− ${formatCurrency(totalExpenses)}`}
          valueColor="#ef4444"
        />
        <StatRow
          label="Net Cash Flow (Month)"
          value={formatCurrency(kpis.netCashFlow || 0)}
          valueColor={(kpis.netCashFlow || 0) >= 0 ? '#10b981' : '#ef4444'}
          highlight
        />
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Estimated Monthly Profit</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: monthlyProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {formatCurrency(monthlyProfit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Profit margin: {profitMargin}%
          </div>
        </div>
      </Section>

      {/* Expense Breakdown by Category */}
      <Section
        title="Expense Breakdown by Category"
        icon={Receipt}
        iconColor="#f59e0b"
        action={
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total: {formatCurrency(totalExpenses)}
          </span>
        }
      >
        {breakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No expense data for the selected period
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {breakdown
              .sort((a, b) => b.value - a.value)
              .map((cat) => {
                const pct = totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: cat.color || '#64748b',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {cat.name}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatCurrency(cat.value)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 99, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: cat.color || '#64748b',
                          borderRadius: 99,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Section>

      {/* Distributor Payables */}
      <Section
        title="Distributor Payables (Pending Bills)"
        icon={Truck}
        iconColor="#ef4444"
        action={
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.1)',
              padding: '3px 10px',
              borderRadius: 99,
            }}
          >
            Outstanding: {formatCurrency(totalDistPending)}
          </span>
        }
      >
        {allPendingBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            🎉 No pending distributor bills — all caught up!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Distributor', 'Bill #', 'Bill Date', 'Total', 'Paid', 'Pending', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPendingBills.map((bill) => {
                  const pending = Number(bill.grandTotal) - Number(bill.paidAmount);
                  return (
                    <TableRow
                      key={bill.id}
                      cells={[
                        { value: bill.supplier?.name || bill.distributor?.name || '—', bold: true, color: 'var(--text-primary)' },
                        { value: bill.invoiceNo ? `#${bill.invoiceNo}` : bill.billNumber || '—', color: 'var(--text-muted)' },
                        { value: formatDate(bill.billDate), color: 'var(--text-muted)' },
                        { value: formatCurrency(bill.grandTotal), bold: true },
                        { value: formatCurrency(bill.paidAmount), color: '#10b981' },
                        { value: formatCurrency(pending), color: '#ef4444', bold: true },
                        {
                          value: (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: 99,
                                background: bill.status === 'PENDING' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                color: bill.status === 'PENDING' ? '#ef4444' : '#f59e0b',
                              }}
                            >
                              {bill.status}
                            </span>
                          ),
                        },
                      ]}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Customer Credit Receivables */}
      <Section
        title="Customer Credit Receivables"
        icon={Users}
        iconColor="#8b5cf6"
        action={
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#8b5cf6',
              background: 'rgba(139,92,246,0.1)',
              padding: '3px 10px',
              borderRadius: 99,
            }}
          >
            Outstanding: {formatCurrency(totalCustOutstanding)}
          </span>
        }
      >
        {customersWithCredit.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            🎉 No outstanding customer credit — all collected!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Customer', 'Phone', 'Outstanding Credit'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customersWithCredit.map((c, i) => (
                  <TableRow
                    key={c.customerId || i}
                    cells={[
                      { value: c.customerName || c.name || '—', bold: true, color: 'var(--text-primary)' },
                      { value: c.phone || '—', color: 'var(--text-muted)' },
                      {
                        value: formatCurrency(c.outstanding || c.outstandingCredit || 0),
                        color: '#8b5cf6',
                        bold: true,
                      },
                    ]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

export default Reports;
