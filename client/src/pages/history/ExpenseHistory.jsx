// src/pages/history/ExpenseHistory.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, FileText, UserCheck, Hash, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/history/FilterBar';
import { ExportButtons } from '../../components/history/ExportButtons';
import { SummaryCards } from '../../components/history/SummaryCards';
import { HistoryTable } from '../../components/history/HistoryTable';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export function ExpenseHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const initialDate = searchParams.get('filter') === 'today' ? format(new Date(), 'yyyy-MM-dd') : '';
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['expense-history', { page, search, selectedMonth, selectedYear, startDate, endDate }],
    queryFn: () =>
      dashboardApi
        .getExpenseHistory({
          page,
          limit: 30,
          search,
          month: selectedMonth,
          year: selectedYear,
          startDate,
          endDate,
        })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const summary = data?.summary || { totalTransactions: 0, totalExpense: 0 };
  const historyList = data?.data || [];
  const pagination = data?.pagination || {};

  const columns = [
    { header: 'Time' },
    { header: 'Expense Category' },
    { header: 'Description' },
    { header: 'Amount', className: 'text-right' },
    { header: 'Running Total', className: 'text-right' },
    { header: 'Added By' },
  ];

  const exportHeaders = [
    { label: 'Date', key: 'dateStr' },
    { label: 'Time', key: 'time' },
    { label: 'Category', key: 'category' },
    { label: 'Description', key: 'description' },
    { label: 'Amount', key: 'amount' },
    { label: 'Running Total', key: 'runningTotal' },
    { label: 'Added By', key: 'addedBy' },
  ];

  const exportData = historyList.map((item) => ({
    ...item,
    dateStr: item.date ? format(new Date(item.date), 'dd MMM yyyy') : '',
  }));

  const summaryCardData = [
    {
      label: 'Total Transactions',
      value: summary.totalTransactions,
      icon: Hash,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
      accentColor: '#3b82f6',
    },
    {
      label: 'Total Expenses',
      value: summary.totalExpense,
      icon: TrendingUp,
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444',
      accentColor: '#ef4444',
    },
  ];

  const handleReset = () => {
    setSearch('');
    setSelectedMonth('');
    setSelectedYear('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Today's & Historical Expenses"
        subtitle="Chronological expense transaction ledger with running balance calculations"
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
              title="Expense History Report"
              headers={exportHeaders}
              data={exportData}
              filename="expense_history"
            />
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
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
        emptyMessage="No expense transactions found for the selected period."
        renderRow={(exp) => (
          <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors">
            <td className="p-4 font-semibold text-slate-200">
              <div className="text-xs text-slate-400 font-normal">
                {exp.date ? format(new Date(exp.date), 'dd MMM yyyy') : ''}
              </div>
              <div className="font-mono text-sm text-slate-100">{exp.time}</div>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: exp.categoryColor || '#ef4444' }}
                />
                <span className="text-xs text-slate-200 font-medium">{exp.category}</span>
              </div>
            </td>
            <td className="p-4 font-medium text-slate-300 max-w-xs truncate" title={exp.description}>
              {exp.description}
            </td>
            <td className="p-4 text-right text-red-400 font-semibold font-mono">
              - {formatCurrency(Number(exp.amount))}
            </td>
            <td className="p-4 text-right font-medium text-slate-200 font-mono">
              {formatCurrency(Number(exp.runningTotal))}
            </td>
            <td className="p-4 text-xs text-slate-400 font-medium">{exp.addedBy}</td>
          </tr>
        )}
      />

      {/* Summary Footer Cards */}
      <div className="pt-2">
        <SummaryCards cards={summaryCardData} />
      </div>
    </div>
  );
}
