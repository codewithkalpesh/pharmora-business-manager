// src/pages/history/BankHistory.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Landmark, ArrowUpRight, ArrowDownLeft, Wallet, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { FilterBar } from '../../components/history/FilterBar';
import { ExportButtons } from '../../components/history/ExportButtons';
import { SummaryCards } from '../../components/history/SummaryCards';
import { HistoryTable } from '../../components/history/HistoryTable';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export function BankHistory() {
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bank-history', { page, selectedMonth, selectedYear, startDate, endDate }],
    queryFn: () =>
      dashboardApi
        .getBankHistory({
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
    totalUPICollection: 0,
    totalDeposits: 0,
    totalExpenses: 0,
    currentBankBalance: 0,
  };
  const historyList = data?.data || [];
  const pagination = data?.pagination || {};

  const columns = [
    { header: 'Date' },
    { header: 'Opening Balance', className: 'text-right' },
    { header: 'UPI Collection', className: 'text-right' },
    { header: 'Cash Deposited', className: 'text-right' },
    { header: 'Bank Expense', className: 'text-right' },
    { header: 'Bank Withdrawal', className: 'text-right' },
    { header: 'Closing Balance', className: 'text-right' },
  ];

  const exportHeaders = [
    { label: 'Date', key: 'dateStr' },
    { label: 'Opening Balance', key: 'openingBalance' },
    { label: 'UPI Collection', key: 'upiCollection' },
    { label: 'Cash Deposited', key: 'cashDeposited' },
    { label: 'Bank Expense', key: 'bankExpense' },
    { label: 'Bank Withdrawal', key: 'bankWithdrawal' },
    { label: 'Closing Balance', key: 'closingBalance' },
  ];

  const exportData = historyList.map((item) => ({
    ...item,
    dateStr: item.date ? format(new Date(item.date), 'dd MMM yyyy') : '',
  }));

  const summaryCardData = [
    {
      label: 'Total UPI Collection',
      value: summary.totalUPICollection,
      icon: ArrowUpRight,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
      accentColor: '#3b82f6',
    },
    {
      label: 'Total Cash Deposited',
      value: summary.totalDeposits,
      icon: Landmark,
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
      accentColor: '#10b981',
    },
    {
      label: 'Total Bank Expenses',
      value: summary.totalExpenses,
      icon: ArrowDownLeft,
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444',
      accentColor: '#ef4444',
    },
    {
      label: 'Current Bank Balance',
      value: summary.currentBankBalance,
      icon: Wallet,
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: '#f59e0b',
      accentColor: '#f59e0b',
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
        title="Bank Balance Ledger & History"
        subtitle="Comprehensive bank ledger tracking UPI receipts, cash deposits, digital expenses, withdrawals, and closing balances"
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
              title="Bank History Report"
              headers={exportHeaders}
              data={exportData}
              filename="bank_history"
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
        emptyMessage="No bank history records found for the selected period."
        renderRow={(entry) => (
          <tr key={entry.id} className="hover:bg-slate-800/20 transition-colors">
            <td className="p-4 font-semibold text-slate-200">
              {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : ''}
            </td>
            <td className="p-4 text-right font-mono text-slate-400">
              {formatCurrency(Number(entry.openingBalance))}
            </td>
            <td className="p-4 text-right font-mono text-blue-400 font-semibold">
              + {formatCurrency(Number(entry.upiCollection))}
            </td>
            <td className="p-4 text-right font-mono text-emerald-400 font-semibold">
              + {formatCurrency(Number(entry.cashDeposited))}
            </td>
            <td className="p-4 text-right font-mono text-red-400 font-semibold">
              - {formatCurrency(Number(entry.bankExpense))}
            </td>
            <td className="p-4 text-right font-mono text-purple-400 font-semibold">
              - {formatCurrency(Number(entry.bankWithdrawal))}
            </td>
            <td className="p-4 text-right font-mono text-slate-100 font-bold bg-slate-800/20">
              {formatCurrency(Number(entry.closingBalance))}
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
