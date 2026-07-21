// src/pages/purchases/Purchases.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit, Trash2, Calendar, FileText, Search,
  TrendingUp, RefreshCw, AlertCircle, ShieldAlert, BadgeInfo
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import Modal from '../../components/common/Modal';
import PurchaseForm from './PurchaseForm';
import { purchaseApi } from '../../api/purchase.api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export function Purchases() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [distributorId, setDistributorId] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch distributors for filters
  const { data: distData } = useQuery({
    queryKey: ['distributors'],
    queryFn: () => purchaseApi.getDistributors({ limit: 100 }).then((r) => r.data.data),
  });
  const distributors = distData?.distributors || [];

  // Fetch purchase bills
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['purchase-bills', { page, distributorId, status, startDate, endDate, search }],
    queryFn: () => purchaseApi.getBills({ page, limit: 30, distributorId, status, startDate, endDate, search }).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

  // Fetch stats
  const { data: stats = { outstandingDues: 0, monthPurchases: 0, dueSoonAmount: 0, dueSoonCount: 0 } } = useQuery({
    queryKey: ['purchase-stats'],
    queryFn: () => purchaseApi.getStats().then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  // Delete bill mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => purchaseApi.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-bills']);
      queryClient.invalidateQueries(['purchase-stats']);
      queryClient.invalidateQueries(['distributors']);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this purchase invoice record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBill(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingBill(null);
    queryClient.invalidateQueries(['purchase-bills']);
    queryClient.invalidateQueries(['purchase-stats']);
    queryClient.invalidateQueries(['distributors']);
  };

  const bills = data?.bills || [];
  const pagination = data?.pagination || {};

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Purchase Invoices"
        subtitle="Log incoming stock purchases, track pending dues, tax aggregates, and suppliers agreements"
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
              New Invoice
            </button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Supplier Dues"
          value={stats.outstandingDues}
          icon={ShieldAlert}
          iconBg="rgba(239, 68, 68, 0.1)"
          iconColor="#ef4444"
          accentColor="#ef4444"
        />
        <KPICard
          label="Monthly Purchases"
          value={stats.monthPurchases}
          icon={TrendingUp}
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="#10b981"
          accentColor="#10b981"
        />
        <KPICard
          label="Due Soon (7 Days)"
          value={stats.dueSoonAmount}
          icon={BadgeInfo}
          iconBg="rgba(245, 158, 11, 0.1)"
          iconColor="#f59e0b"
          accentColor="#f59e0b"
        />
        <KPICard
          label="Pending Bills Count"
          rawText={`${stats.dueSoonCount || 0} Bills`}
          icon={FileText}
          iconBg="rgba(139, 92, 246, 0.1)"
          iconColor="#8b5cf6"
          accentColor="#8b5cf6"
        />
      </div>

      {/* Filters Search Bar */}
      <div className="card bg-slate-900/60 border border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice No..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <select
            value={distributorId}
            onChange={(e) => setDistributorId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Distributors</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-400">
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

          {(distributorId || status || startDate || endDate || search) && (
            <button
              onClick={() => { setDistributorId(''); setStatus(''); setStartDate(''); setEndDate(''); setSearch(''); }}
              className="text-xs text-slate-400 hover:text-slate-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border border-slate-800 bg-slate-900/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            <span>Loading purchase invoices...</span>
          </div>
        ) : bills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Supplier / Distributor</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4 text-right">Tax Breakdowns</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-right">Paid Amount</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
                {bills.map((bill) => {
                  const balance = Number(bill.grandTotal) - Number(bill.paidAmount);
                  const isOverdue = new Date(bill.dueDate) < new Date() && bill.status !== 'PAID';
                  return (
                    <tr key={bill.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-semibold text-slate-200 font-mono">
                        {bill.invoiceNo}
                      </td>
                      <td className="p-4 font-semibold text-slate-150">
                        {bill.supplier?.name}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div>Bill: {format(new Date(bill.billDate), 'dd MMM yyyy')}</div>
                        <div className={`mt-0.5 ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                          Due: {format(new Date(bill.dueDate), 'dd MMM yyyy')} {isOverdue && '(Overdue)'}
                        </div>
                      </td>
                      <td className="p-4 text-right text-xs text-slate-455 font-mono">
                        <div>Sub: {formatCurrency(Number(bill.subtotal))}</div>
                        <div>Tax: +{formatCurrency(Number(bill.gstAmount))}</div>
                        {Number(bill.discountAmount) > 0 && <div className="text-emerald-500">Disc: -{formatCurrency(Number(bill.discountAmount))}</div>}
                      </td>
                      <td className="p-4 text-right font-semibold font-mono text-slate-200">
                        {formatCurrency(Number(bill.grandTotal))}
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-450">
                        {formatCurrency(Number(bill.paidAmount))}
                      </td>
                      <td className="p-4 text-right font-semibold font-mono text-slate-300">
                        {formatCurrency(balance)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold font-mono uppercase ${
                          bill.status === 'PAID' 
                            ? 'bg-emerald-500/10 text-emerald-450' 
                            : bill.status === 'PARTIAL' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                            title="Edit bill details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                            title="Delete bill record"
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
            <AlertCircle className="h-10 w-10 text-slate-655" />
            <h4 className="text-slate-350 font-semibold">No purchase invoices found</h4>
            <p className="text-xs">Log new stock bills by clicking the "New Invoice" button.</p>
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

      {/* Purchase invoice dialog */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingBill ? 'Edit Purchase Invoice' : 'Log Purchase Invoice'}
      >
        <PurchaseForm
          initialData={editingBill}
          onSuccess={handleFormSuccess}
          onClose={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
export default Purchases;
