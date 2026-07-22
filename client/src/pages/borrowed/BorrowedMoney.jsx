// src/pages/borrowed/BorrowedMoney.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { borrowedApi } from '../../api/borrowed.api';
import { BorrowedMoneyFormModal } from './BorrowedMoneyFormModal';
import { RepaymentModal } from './RepaymentModal';
import { RepaymentHistoryModal } from './RepaymentHistoryModal';
import {
  HandCoins, Plus, Search, Filter, Calendar, Bell, History,
  DollarSign, CheckCircle2, AlertTriangle, Clock, Edit2, Trash2,
  RefreshCw, ArrowUpRight, ArrowDownLeft, Send, Phone
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export function BorrowedMoney() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalBorrowed: 0,
    totalTarget: 0,
    totalPaid: 0,
    totalRemaining: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState(null);

  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [selectedForRepay, setSelectedForRepay] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedForHistory, setSelectedForHistory] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchBorrowedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await borrowedApi.getBorrowedList({
        page,
        limit: 30,
        search,
        status: statusFilter,
      });

      const data = response.data.data;
      setItems(data.items || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || { totalPages: 1 });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch borrowed money records.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBorrowedData();
  }, [fetchBorrowedData]);

  // Handlers
  const handleCreateOrUpdate = async (formData) => {
    setSubmitting(true);
    try {
      let createdRecord = null;
      if (selectedForEdit) {
        await borrowedApi.updateBorrowed(selectedForEdit.id, formData);
      } else {
        const res = await borrowedApi.createBorrowed(formData);
        createdRecord = res.data?.data;
      }
      setIsFormOpen(false);
      setSelectedForEdit(null);
      await fetchBorrowedData();

      // Automatically open the transaction & repayment history window for the newly added record
      if (createdRecord) {
        try {
          const fullItemRes = await borrowedApi.getBorrowedById(createdRecord.id);
          setSelectedForHistory(fullItemRes.data?.data || createdRecord);
        } catch {
          setSelectedForHistory(createdRecord);
        }
        setIsHistoryOpen(true);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRepayment = async (repayData, itemId) => {
    const targetId = itemId || selectedForRepay?.id;
    if (!targetId) return;
    setSubmitting(true);
    try {
      await borrowedApi.addRepayment(targetId, repayData);
      setIsRepayOpen(false);
      setSelectedForRepay(null);
      fetchBorrowedData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRepayment = async (repaymentId) => {
    if (!window.confirm('Are you sure you want to delete this repayment record?')) return;
    try {
      await borrowedApi.deleteRepayment(repaymentId);
      if (selectedForHistory) {
        const res = await borrowedApi.getBorrowedById(selectedForHistory.id);
        setSelectedForHistory(res.data.data);
      }
      fetchBorrowedData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete repayment.');
    }
  };

  const handleDeleteRecord = async (id, personName) => {
    if (!window.confirm(`Are you sure you want to delete the record for "${personName}"?`)) return;
    try {
      await borrowedApi.deleteBorrowed(id);
      fetchBorrowedData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete record.');
    }
  };

  const getStatusBadge = (item) => {
    if (item.displayStatus === 'OVERDUE' || item.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle size={12} /> OVERDUE
        </span>
      );
    }
    if (item.status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> PAID
        </span>
      );
    }
    if (item.status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock size={12} /> PARTIAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Clock size={12} /> PENDING
      </span>
    );
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <PageHeader
        title="Borrowed Money & Payment Reminders"
        subtitle="Track money borrowed from people, schedule payback target dates, record repayments, and sync to cashbook."
      >
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={() => {
              setSelectedForRepay(null);
              setIsRepayOpen(true);
            }}
            className="btn btn-secondary font-semibold flex items-center gap-2 shadow-lg"
          >
            <Send size={16} />
            Record Repayment
          </button>
          <button
            onClick={() => {
              setSelectedForEdit(null);
              setIsFormOpen(true);
            }}
            className="btn btn-primary font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            Add Borrowed Money
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Borrowed */}
        <div className="card p-5 border border-slate-800 bg-slate-900/60 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <HandCoins size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">Total Borrowed</span>
            <span className="text-xl font-bold text-slate-100">{formatCurrency(summary.totalBorrowed || 0)}</span>
          </div>
        </div>

        {/* Target Payback */}
        <div className="card p-5 border border-slate-800 bg-slate-900/60 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">Target Payback</span>
            <span className="text-xl font-bold text-amber-400">{formatCurrency(summary.totalTarget || 0)}</span>
          </div>
        </div>

        {/* Total Repaid */}
        <div className="card p-5 border border-slate-800 bg-slate-900/60 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">Total Repaid</span>
            <span className="text-xl font-bold text-emerald-400">{formatCurrency(summary.totalPaid || 0)}</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="card p-5 border border-slate-800 bg-slate-900/60 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Bell size={22} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">Remaining Due</span>
              <span className="text-xl font-bold text-red-400">{formatCurrency(summary.totalRemaining || 0)}</span>
            </div>
          </div>
          {summary.overdueCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
              {summary.overdueCount} Overdue
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border border-slate-800 bg-slate-900/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search lender or person name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-9 text-xs"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={15} className="text-slate-450" />
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-750">
            {['ALL', 'PENDING', 'PARTIAL', 'OVERDUE', 'PAID'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-450 gap-2">
            <RefreshCw className="animate-spin h-5 w-5 text-emerald-400" />
            <span>Loading borrowed money records...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 text-xs">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-450 space-y-3">
            <HandCoins size={36} className="mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No borrowed money records found</p>
            <p className="text-xs text-slate-500">Click "Add Borrowed Money" above to create your first record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 uppercase tracking-wider text-[11px] font-semibold text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Lender / Person</th>
                  <th className="py-3.5 px-4">Borrow Date</th>
                  <th className="py-3.5 px-4">Target Due Date</th>
                  <th className="py-3.5 px-4 text-right">Borrowed</th>
                  <th className="py-3.5 px-4 text-right">Target Payback</th>
                  <th className="py-3.5 px-4 text-right">Repaid</th>
                  <th className="py-3.5 px-4 text-right">Remaining</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{item.personName}</div>
                      {item.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-450 mt-0.5">
                          <Phone size={10} /> {item.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {formatDate(item.borrowDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.targetDate ? (
                        <div className={`flex items-center gap-1 font-medium ${item.isOverdue ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                          <Calendar size={13} className={item.isOverdue ? 'text-red-400' : 'text-amber-400'} />
                          {formatDate(item.targetDate)}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No target date</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                      {formatCurrency(item.borrowedAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                      {formatCurrency(item.targetAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                      {formatCurrency(item.paidAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      <span className={item.remainingAmount > 0 ? 'text-red-400' : 'text-slate-400'}>
                        {formatCurrency(item.remainingAmount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(item)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        {item.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedForRepay(item);
                              setIsRepayOpen(true);
                            }}
                            className="btn btn-ghost px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1"
                            title="Record Repayment"
                          >
                            <Send size={12} /> Pay
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedForHistory(item);
                            setIsHistoryOpen(true);
                          }}
                          className="btn btn-ghost p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                          title="View Repayment History"
                        >
                          <History size={15} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedForEdit(item);
                            setIsFormOpen(true);
                          }}
                          className="btn btn-ghost p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                          title="Edit Record"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteRecord(item.id, item.personName)}
                          className="btn btn-ghost p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <BorrowedMoneyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedForEdit(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedForEdit}
        loading={submitting}
      />

      {/* Repayment Modal */}
      <RepaymentModal
        isOpen={isRepayOpen}
        onClose={() => {
          setIsRepayOpen(false);
          setSelectedForRepay(null);
        }}
        onSubmit={handleAddRepayment}
        borrowedItem={selectedForRepay}
        activeItems={items.filter(item => item.status !== 'PAID')}
        loading={submitting}
      />

      {/* History Modal */}
      <RepaymentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedForHistory(null);
        }}
        item={selectedForHistory}
        onDeleteRepayment={handleDeleteRepayment}
      />
    </div>
  );
}

export default BorrowedMoney;
