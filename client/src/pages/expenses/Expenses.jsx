// src/pages/expenses/Expenses.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit, Trash2, Calendar, FileText, Search, Settings,
  TrendingUp, Wallet, Landmark, RefreshCw, Paperclip, AlertCircle, ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import Modal from '../../components/common/Modal';
import ExpenseForm from './ExpenseForm';
import CategoriesModal from './CategoriesModal';
import { expenseApi } from '../../api/expense.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export function Expenses() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseApi.getCategories().then((r) => r.data.data),
  });

  // Fetch expenses
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expenses', { page, categoryId, startDate, endDate, search }],
    queryFn: () => expenseApi.getExpenses({ page, limit: 30, categoryId, startDate, endDate, search }).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

  // Fetch stats for monthly KPIs
  const { data: stats = { totalAmount: 0, breakdown: [] } } = useQuery({
    queryKey: ['expenses-stats', { startDate, endDate }],
    queryFn: () => expenseApi.getStats({ startDate, endDate }).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenses-stats']);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense record? This will also remove the attached receipt.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    queryClient.invalidateQueries(['expenses']);
    queryClient.invalidateQueries(['expenses-stats']);
  };

  const expenses = data?.expenses || [];
  const pagination = data?.pagination || {};

  // Top category computation
  const sortedBreakdown = [...stats.breakdown].sort((a, b) => b.value - a.value);
  const topCategory = sortedBreakdown[0] ? `${sortedBreakdown[0].name} (${formatCurrency(sortedBreakdown[0].value)})` : 'None';

  // Cash vs Bank split calculation
  const totalsByMode = expenses.reduce(
    (acc, curr) => {
      if (curr.paymentMode === 'CASH') acc.cash += Number(curr.amount);
      else acc.bank += Number(curr.amount);
      return acc;
    },
    { cash: 0, bank: 0 }
  );

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Operating Expenses"
        subtitle="Record shop expenses, upload invoice receipts, and review monthly cost reports"
        actions={
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setIsCatOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Manage Categories
            </button>
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
              New Expense
            </button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Monthly Expenses"
          value={stats.totalAmount}
          icon={TrendingUp}
          iconBg="rgba(239, 68, 68, 0.1)"
          iconColor="#ef4444"
          accentColor="#ef4444"
        />
        <KPICard
          label="Cash Expenses (Page)"
          value={totalsByMode.cash}
          icon={Wallet}
          iconBg="rgba(245, 158, 11, 0.1)"
          iconColor="#f59e0b"
          accentColor="#f59e0b"
        />
        <KPICard
          label="Bank/UPI Expenses (Page)"
          value={totalsByMode.bank}
          icon={Landmark}
          iconBg="rgba(59, 130, 246, 0.1)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
        />
        <KPICard
          label="Top Expense Category"
          rawText={topCategory}
          icon={FileText}
          iconBg="rgba(139, 92, 246, 0.1)"
          iconColor="#8b5cf6"
          accentColor="#8b5cf6"
        />
      </div>

      {/* Filter / Search section */}
      <div className="card bg-slate-900/60 border border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-400 ml-2">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-[11px] text-slate-200 focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-[11px] text-slate-200 focus:outline-none"
            />
          </div>
          
          {(categoryId || startDate || endDate || search) && (
            <button
              onClick={() => { setCategoryId(''); setStartDate(''); setEndDate(''); setSearch(''); }}
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
            <span>Loading operating expenses...</span>
          </div>
        ) : expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4 text-center">Receipt</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">
                      {format(new Date(exp.date), 'dd MMM yyyy')}
                    </td>
                    <td className="p-4 font-semibold text-slate-150">
                      {exp.description}
                      {exp.isRecurring && (
                        <span className="text-[10px] bg-slate-855 text-slate-400 px-1.5 py-0.5 rounded ml-2 uppercase">Recurring</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2.5 w-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: exp.category?.color || '#64748b' }}
                        />
                        <span className="text-xs text-slate-300 font-medium">{exp.category?.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-red-400 font-semibold font-mono">
                      - {formatCurrency(Number(exp.amount))}
                    </td>
                    <td className="p-4">
                      <span className="inline-block rounded px-2 py-0.5 text-xs bg-slate-800/60 text-slate-400">
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {exp.receiptUrl ? (
                        <a 
                          href={`http://localhost:5000${exp.receiptUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs px-2 py-1 transition-colors"
                        >
                          <Paperclip className="h-3 w-3" />
                          View Receipt
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
            <AlertCircle className="h-10 w-10 text-slate-600" />
            <h4 className="text-slate-350 font-semibold">No expense records found</h4>
            <p className="text-xs">No records exist for the selected filters. Click "New Expense" to add a record.</p>
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

      {/* Slide up Expense Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Record Operating Expense'}
      >
        <ExpenseForm
          initialData={editingExpense}
          onSuccess={handleFormSuccess}
          onClose={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Custom Categories Modal */}
      <Modal
        isOpen={isCatOpen}
        onClose={() => setIsCatOpen(false)}
        title="Manage Expense Categories"
      >
        <CategoriesModal
          onClose={() => setIsCatOpen(false)}
        />
      </Modal>
    </div>
  );
}
export default Expenses;
