// src/pages/dashboard/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, Wallet, Building2,
  Truck, Users, PiggyBank, BarChart3, ArrowUpDown,
  CalendarClock, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { SalesChart } from '../../components/charts/SalesChart';
import { ExpenseChart } from '../../components/charts/ExpenseChart';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';
import { format } from 'date-fns';

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function UpcomingRow({ item }) {
  const rawDate = item.nextDueDate || item.dueDate;
  const dueDate = rawDate ? new Date(rawDate) : new Date();
  const daysLeft = Math.ceil((dueDate - Date.now()) / 86400000);
  const urgency = daysLeft <= 2 ? 'error' : daysLeft <= 5 ? 'warning' : 'success';

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          {item.title || item.description}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {item.type === 'DISTRIBUTOR' ? '🏭 Distributor' : '📋 Recurring'}
        </div>
      </td>
      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        {formatCurrency(item.amount)}
      </td>
      <td>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {format(dueDate, 'dd MMM yyyy')}
        </div>
      </td>
      <td>
        <span className={`badge badge-${urgency}`}>
          {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
        </span>
      </td>
    </tr>
  );
}

export function Dashboard() {
  const { user } = useAuth();

  const { data: kpiData, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKPIs().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: salesTrend } = useQuery({
    queryKey: ['dashboard-sales-trend'],
    queryFn: () => dashboardApi.getSalesTrend().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: expenseByCategory } = useQuery({
    queryKey: ['dashboard-expense-category'],
    queryFn: () => dashboardApi.getExpenseByCategory().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const kpis = kpiData?.kpis || {};

  const KPI_CONFIG = [
    {
      label: "Today's Sales",
      value: kpis.todaySales,
      icon: DollarSign,
      iconBg: 'rgba(16,185,129,0.12)',
      iconColor: '#10b981',
      accentColor: '#10b981',
      trend: 12.5,
    },
    {
      label: "Today's Expenses",
      value: kpis.todayExpenses,
      icon: TrendingUp,
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#ef4444',
      accentColor: '#ef4444',
      trend: -3.2,
    },
    {
      label: 'Cash in Hand',
      value: kpis.cashInHand,
      icon: Wallet,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#f59e0b',
      accentColor: '#f59e0b',
    },
    {
      label: 'Bank Balance',
      value: kpis.bankBalance,
      icon: Building2,
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#3b82f6',
      accentColor: '#3b82f6',
    },
    {
      label: 'Distributor Pending',
      value: kpis.distributorPending,
      icon: Truck,
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#ef4444',
      accentColor: '#ef4444',
    },
    {
      label: 'Customer Credit',
      value: kpis.customerCredit,
      icon: Users,
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: '#8b5cf6',
      accentColor: '#8b5cf6',
    },
    {
      label: 'Monthly Profit',
      value: kpis.monthlyProfit,
      icon: PiggyBank,
      iconBg: 'rgba(16,185,129,0.12)',
      iconColor: '#10b981',
      accentColor: '#10b981',
      trend: 8.1,
    },
    {
      label: 'Monthly Revenue',
      value: kpis.monthlyRevenue,
      icon: BarChart3,
      iconBg: 'rgba(6,182,212,0.1)',
      iconColor: '#06b6d4',
      accentColor: '#06b6d4',
    },
    {
      label: 'Net Cash Flow',
      value: kpis.netCashFlow,
      icon: ArrowUpDown,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#f59e0b',
      accentColor: '#f59e0b',
    },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <PageHeader
        title={`${GREETING()}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle={`${format(new Date(), 'EEEE, dd MMMM yyyy')} — Here's your business at a glance`}
        actions={
          <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* KPI Grid */}
      <div className="grid-4 mb-6">
        {KPI_CONFIG.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-3 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <SalesChart data={salesTrend || []} />
        <ExpenseChart data={expenseByCategory || []} />
      </div>

      <div className="mb-6">
        <CashFlowChart />
      </div>

      {/* Upcoming payments */}
      <div className="card mb-6">
        <div className="chart-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarClock size={18} color="var(--brand-500)" />
              Upcoming Payments
            </div>
            <div className="chart-subtitle">Next 14 days — stay ahead of your dues</div>
          </div>
          <button className="btn btn-secondary btn-sm">View all</button>
        </div>

        {kpiData?.upcomingRecurring?.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {kpiData.upcomingRecurring.map((item, i) => (
                  <UpcomingRow key={item.id || i} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '28px 16px', textAlign: 'center' }}>
            <CalendarClock size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>No upcoming dues</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>You have no upcoming bills or recurring dues scheduled.</div>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="chart-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="chart-title">Recent Transactions</div>
            <div className="chart-subtitle">Latest 10 entries across all modules</div>
          </div>
          <button className="btn btn-secondary btn-sm">View all</button>
        </div>

        {kpiData?.recentTransactions?.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {kpiData.recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.description}</td>
                    <td>
                      <span className={`badge ${t.isIncome ? 'badge-success' : 'badge-info'}`}>
                        {t.category?.name}
                      </span>
                    </td>
                    <td style={{ color: t.isIncome ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                      {t.isIncome ? '+ ' : '− '}{formatCurrency(t.amount)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {formatDate(t.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <BarChart3 size={40} />
            <h3>No transactions yet</h3>
            <p>Start recording your daily cash, expenses, and purchases to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
