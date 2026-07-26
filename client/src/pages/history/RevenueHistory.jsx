// src/pages/history/RevenueHistory.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, DollarSign, Smartphone, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/history/FilterBar';
import { ExportButtons } from '../../components/history/ExportButtons';
import { SummaryCards } from '../../components/history/SummaryCards';
import { HistoryTable } from '../../components/history/HistoryTable';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export function RevenueHistory() {
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['revenue-history', { page, selectedMonth, selectedYear, startDate, endDate }],
    queryFn: () =>
      dashboardApi
        .getRevenueHistory({
          page,
          limit: 30,
          month: selectedMonth,
          year: selectedYear,
          startDate,
          endDate,
        })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const summary = data?.summary || {
    monthlyRevenue: 0,
    cashRevenue: 0,
    digitalRevenue: 0,
    avgDailyRevenue: 0,
  };
  const charts = data?.charts || { dailyRevenueTrend: [], cashVsDigital: [] };
  const historyList = data?.data || [];
  const pagination = data?.pagination || {};

  const columns = [
    { header: 'Date' },
    { header: 'Cash Sales', className: 'text-right' },
    { header: 'UPI Sales', className: 'text-right' },
    { header: 'Card Sales', className: 'text-right' },
    { header: 'Credit Sales', className: 'text-right' },
    { header: 'Total Revenue', className: 'text-right' },
  ];

  const exportHeaders = [
    { label: 'Date', key: 'dateStr' },
    { label: 'Cash Sales', key: 'cashSales' },
    { label: 'UPI Sales', key: 'upiSales' },
    { label: 'Card Sales', key: 'cardSales' },
    { label: 'Credit Sales', key: 'creditSales' },
    { label: 'Total Revenue', key: 'totalRevenue' },
  ];

  const exportData = historyList.map((item) => ({
    ...item,
    dateStr: item.date ? format(new Date(item.date), 'dd MMM yyyy') : '',
  }));

  const summaryCardData = [
    {
      label: 'Monthly Revenue',
      value: summary.monthlyRevenue,
      icon: BarChart3,
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
      accentColor: '#10b981',
    },
    {
      label: 'Cash Revenue',
      value: summary.cashRevenue,
      icon: DollarSign,
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: '#f59e0b',
      accentColor: '#f59e0b',
    },
    {
      label: 'Digital Revenue (UPI & Card)',
      value: summary.digitalRevenue,
      icon: Smartphone,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
      accentColor: '#3b82f6',
    },
    {
      label: 'Average Daily Revenue',
      value: summary.avgDailyRevenue,
      icon: Calendar,
      iconBg: 'rgba(139, 92, 246, 0.1)',
      iconColor: '#8b5cf6',
      accentColor: '#8b5cf6',
    },
  ];

  const handleReset = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Revenue History & Performance"
        subtitle="Daily breakdown of sales streams (Cash, UPI, Card, Credit) with trends and analytics"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary btn-sm flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <ExportButtons
              title="Revenue History Report"
              headers={exportHeaders}
              data={exportData}
              filename="revenue_history"
            />
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        showSearch={false}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onReset={handleReset}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Trend Chart */}
        <div className="lg:col-span-2 card bg-slate-900/60 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              Daily Revenue Trend
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.dailyRevenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="totalRevenue" name="Total Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cashSales" name="Cash Sales" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="digitalSales" name="Digital Sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash vs Digital Revenue Breakdown Chart */}
        <div className="card bg-slate-900/60 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-400" />
              Cash vs Digital Breakdown
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.cashVsDigital} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                />
                <Bar dataKey="value" name="Revenue Amount" radius={[6, 6, 0, 0]}>
                  {charts.cashVsDigital.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <HistoryTable
        columns={columns}
        data={historyList}
        isLoading={isLoading}
        isError={isError}
        error={error}
        pagination={pagination}
        page={page}
        setPage={setPage}
        emptyMessage="No revenue history records found for the selected period."
        renderRow={(entry) => (
          <tr key={entry.id} className="hover:bg-slate-800/20 transition-colors">
            <td className="p-4 font-semibold text-slate-200">
              {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : ''}
            </td>
            <td className="p-4 text-right font-mono text-emerald-400 font-medium">
              {formatCurrency(Number(entry.cashSales))}
            </td>
            <td className="p-4 text-right font-mono text-blue-400 font-medium">
              {formatCurrency(Number(entry.upiSales))}
            </td>
            <td className="p-4 text-right font-mono text-purple-400 font-medium">
              {formatCurrency(Number(entry.cardSales))}
            </td>
            <td className="p-4 text-right font-mono text-amber-400 font-medium">
              {formatCurrency(Number(entry.creditSales))}
            </td>
            <td className="p-4 text-right font-mono text-slate-100 font-bold bg-slate-800/20">
              {formatCurrency(Number(entry.totalRevenue))}
            </td>
          </tr>
        )}
      />

      {/* Bottom Summary */}
      <div className="pt-2">
        <SummaryCards cards={summaryCardData} />
      </div>
    </div>
  );
}
