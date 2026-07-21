// src/pages/cashbook/CashBook.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit, Trash2, Calendar, FileText, Search,
  TrendingUp, TrendingDown, Landmark, RefreshCw, AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import Modal from '../../components/common/Modal';
import CashBookForm from './CashBookForm';
import { cashBookApi } from '../../api/cashbook.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export function CashBook() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Fetch entries
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cashbook', { page, startDate, endDate }],
    queryFn: () => cashBookApi.getEntries({ page, limit: 30, startDate, endDate }).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => cashBookApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['cashbook']);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this cash book entry? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    queryClient.invalidateQueries(['cashbook']);
  };

  const entries = data?.entries || [];
  const pagination = data?.pagination || {};

  // Aggregate stats from the fetched entries (normally this is done via a backend stats API, but local aggregation is clean here)
  const stats = entries.reduce(
    (acc, cur) => {
      acc.cashSales += Number(cur.cashSales);
      acc.upiReceipts += Number(cur.upiReceipts);
      acc.cardReceipts += Number(cur.cardReceipts);
      acc.difference += Number(cur.cashDifference);
      return acc;
    },
    { cashSales: 0, upiReceipts: 0, cardReceipts: 0, difference: 0 }
  );

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Daily Cash Book"
        subtitle="Manage daily ledger entries, track sales, deposits, expenses, and shortages"
        actions={
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="btn btn-primary btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 font-semibold" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              New Entry
            </button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Cash Sales"
          value={stats.cashSales}
          icon={TrendingUp}
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="#10b981"
          accentColor="#10b981"
        />
        <KPICard
          label="UPI Receipts"
          value={stats.upiReceipts}
          icon={Landmark}
          iconBg="rgba(59, 130, 246, 0.1)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
        />
        <KPICard
          label="Card Receipts"
          value={stats.cardReceipts}
          icon={FileText}
          iconBg="rgba(139, 92, 246, 0.1)"
          iconColor="#8b5cf6"
          accentColor="#8b5cf6"
        />
        <KPICard
          label="Net Difference"
          value={stats.difference}
          icon={stats.difference >= 0 ? TrendingUp : TrendingDown}
          iconBg={stats.difference >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)'}
          iconColor={stats.difference >= 0 ? '#10b981' : '#ef4444'}
          accentColor={stats.difference >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      {/* Filter / Search section */}
      <div className="card bg-slate-900/60 border border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-slate-400 hover:text-slate-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="card p-0 overflow-hidden border border-slate-800 bg-slate-900/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            <span>Loading daily ledger...</span>
          </div>
        ) : entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Opening Cash</th>
                  <th className="p-4 text-right">Cash Sales</th>
                  <th className="p-4 text-right">UPI Receipts</th>
                  <th className="p-4 text-right">Total Expenses</th>
                  <th className="p-4 text-right">Closing (Actual)</th>
                  <th className="p-4 text-right">Difference</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {entries.map((entry) => {
                  const diff = Number(entry.cashDifference);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-semibold text-slate-200">
                        {format(new Date(entry.date), 'dd MMM yyyy')}
                      </td>
                      <td className="p-4 text-right text-slate-400 font-mono">
                        {formatCurrency(Number(entry.openingCash))}
                      </td>
                      <td className="p-4 text-right text-emerald-400 font-semibold font-mono">
                        {formatCurrency(Number(entry.cashSales))}
                      </td>
                      <td className="p-4 text-right text-blue-400 font-semibold font-mono">
                        {formatCurrency(Number(entry.upiReceipts))}
                      </td>
                      <td className="p-4 text-right text-red-400 font-semibold font-mono">
                        {formatCurrency(Number(entry.totalExpenses))}
                      </td>
                      <td className="p-4 text-right text-slate-200 font-semibold font-mono">
                        {formatCurrency(Number(entry.closingCash))}
                      </td>
                      <td className="p-4 text-right font-mono">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          diff === 0 
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : diff > 0 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-xs text-slate-400" title={entry.notes}>
                        {entry.notes || '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
            <AlertCircle className="h-10 w-10 text-slate-600" />
            <h4 className="text-slate-350 font-semibold">No ledger entries found</h4>
            <p className="text-xs">No records exist for the selected date range. Click "New Entry" to start recording.</p>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Showing page {page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Slide up Entry Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEntry ? 'Edit Daily Cash Book Entry' : 'New Daily Cash Book Entry'}
      >
        <CashBookForm
          initialData={editingEntry}
          onSuccess={handleFormSuccess}
          onClose={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
