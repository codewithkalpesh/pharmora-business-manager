import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Plus, Calendar, AlertCircle, ToggleLeft, ToggleRight,
  Play, Edit, Trash2, CheckCircle2, DollarSign, Activity, FileText, Search
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { recurringApi } from '../../api/recurring.api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';
import RecurringForm from './RecurringForm';

export function Recurring() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const isOwnerOrManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const loadStats = useCallback(async () => {
    try {
      const res = await recurringApi.getRecurringStats();
      setStats(res.data?.data || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadSchedules = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        limit: 20,
        type: filterType || undefined,
        frequency: filterFrequency || undefined,
        search: searchQuery || undefined,
      };
      const res = await recurringApi.getRecurrings(params);
      setSchedules(res.data?.recurrings || []);
      setPage(res.data?.pagination?.page || 1);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalRecords(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterFrequency, searchQuery]);

  const fetchAll = useCallback(() => {
    loadStats();
    loadSchedules(1);
  }, [loadStats, loadSchedules]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => { setPage(1); }, [filterType, filterFrequency, searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) loadSchedules(newPage);
  };

  const handleCreate = () => {
    setSelectedSchedule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring schedule? This will stop future executions.')) return;
    try {
      await recurringApi.deleteRecurring(id);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete schedule.');
    }
  };

  const handleToggleActive = async (schedule) => {
    try {
      await recurringApi.updateRecurring(schedule.id, {
        isActive: !schedule.isActive,
      });
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update schedule status.');
    }
  };

  const handleRunManual = async (id) => {
    if (!window.confirm('Record this payment/transaction as paid now? It will automatically reflect in your Cash Book/Expenses and update the next due date.')) return;
    setProcessingId(id);
    try {
      const res = await recurringApi.processManualOccurrence(id);
      alert(`Transaction recorded successfully! Next due date is now: ${new Date(res.data?.nextDueDate).toLocaleDateString('en-IN')}`);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to record transaction.');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePostpone = async (id) => {
    setProcessingId(id);
    try {
      await recurringApi.postponeReminder(id);
      alert('Reminder postponed! We will remind you again tomorrow.');
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to postpone reminder.');
    } finally {
      setProcessingId(null);
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const getFreqLabel = (freq, days) => {
    if (freq === 'DAILY') return 'Every Day';
    if (freq === 'WEEKLY') return 'Every Week';
    if (freq === 'MONTHLY') return 'Every Month';
    if (freq === 'QUARTERLY') return 'Every Quarter';
    if (freq === 'HALF_YEARLY') return 'Every 6 Months';
    if (freq === 'YEARLY') return 'Every Year';
    return `Every ${days} Days`;
  };

  const upcoming5Days = schedules.filter((s) => {
    if (!s.isActive) return false;
    const due = new Date(s.nextDueDate);
    const diffDays = Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 5;
  });

  return (
    <div className="space-y-6 text-slate-300">
      <PageHeader
        title="Recurring Bills & Reminders"
        subtitle="Manage and automate repeating vendor payments, bills, salary payouts, or recurring other income streams."
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {isOwnerOrManager && (
              <button
                className="btn btn-primary btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 font-semibold"
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4" /> Add Schedule
              </button>
            )}
          </div>
        }
      />

      {/* KPI stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="kpi-card">
            <div className="kpi-label">Active Schedules</div>
            <div className="kpi-value text-slate-100">{stats.activeCount}</div>
            <div className="text-[11px] text-slate-450 mt-1">Total recurring flows</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Projected Monthly Expenses</div>
            <div className="kpi-value text-red-400">{formatCurrency(stats.projectedMonthlyExpense)}</div>
            <div className="text-[11px] text-slate-450 mt-1">Calculated monthly rate</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Projected Monthly Income</div>
            <div className="kpi-value text-emerald-400">{formatCurrency(stats.projectedMonthlyIncome)}</div>
            <div className="text-[11px] text-slate-450 mt-1">Calculated monthly rate</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Net Projected Monthly Cashflow</div>
            <div className={`kpi-value ${stats.projectedMonthlyIncome - stats.projectedMonthlyExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(stats.projectedMonthlyIncome - stats.projectedMonthlyExpense)}
            </div>
            <div className="text-[11px] text-slate-450 mt-1">Projected net cashflow</div>
          </div>
        </div>
      )}

      {/* 5-Day Upcoming Dues Notifications Banner */}
      {upcoming5Days.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span>⚡ Upcoming Dues (Next 5 Days) — Action Required</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming5Days.map((item) => {
              const daysLeft = Math.ceil((new Date(item.nextDueDate) - Date.now()) / 86400000);
              return (
                <div key={item.id} className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-100 text-sm">{item.title}</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Due Date: <strong className="text-slate-200">{fmtDate(item.nextDueDate)}</strong> ({daysLeft <= 0 ? 'Due Today' : `In ${daysLeft} days`})
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handlePostpone(item.id)}
                      disabled={processingId === item.id}
                      className="btn btn-secondary btn-xs text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      ⏰ Remind Tomorrow
                    </button>
                    <button
                      onClick={() => handleRunManual(item.id)}
                      disabled={processingId === item.id}
                      className="btn btn-primary btn-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold border-none"
                    >
                      💳 Is it Paid? (Record Now)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters section */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-1.5 w-full md:w-[320px]">
          <Search className="h-4 w-4 text-slate-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedules by title..."
            className="bg-transparent border-none text-xs text-slate-200 focus:outline-none focus:ring-0 w-full"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input"
          style={{ width: '160px' }}
        >
          <option value="">All Types</option>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>

        <select
          value={filterFrequency}
          onChange={(e) => setFilterFrequency(e.target.value)}
          className="input"
          style={{ width: '180px' }}
        >
          <option value="">All Frequencies</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="HALF_YEARLY">Half Yearly</option>
          <option value="YEARLY">Yearly</option>
          <option value="CUSTOM">Custom Days</option>
        </select>
      </div>

      {/* Main schedule card grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          <span>Loading schedules...</span>
        </div>
      ) : schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {schedules.map((s) => (
            <div
              key={s.id}
              className={`card relative border p-5 flex flex-col justify-between transition-all hover:border-slate-700/80 bg-slate-900/20 ${
                s.isActive ? 'border-slate-800' : 'border-slate-900/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        s.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {s.type}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                        {s.action === 'AUTO_DRAFT' ? 'Auto Draft' : 'Reminder'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 mt-2.5">{s.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnerOrManager && (
                      <>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className="text-slate-400 hover:text-slate-100 transition-colors"
                          title={s.isActive ? 'Deactivate Schedule' : 'Activate Schedule'}
                        >
                          {s.isActive ? (
                            <ToggleRight className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-slate-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[32px]">
                  {s.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 py-3 border-y border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Frequency</span>
                    <span className="text-xs font-semibold text-slate-200">{getFreqLabel(s.frequency, s.customDays)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Projected Amount</span>
                    <span className="text-xs font-bold text-slate-100 font-mono">{formatCurrency(s.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-1.5 text-slate-450 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Next Due:</span>
                  <span className="text-slate-200 font-medium">{fmtDate(s.nextDueDate)}</span>
                </div>

                {s.isActive && isOwnerOrManager && (
                  <button
                    onClick={() => handleRunManual(s.id)}
                    disabled={processingId === s.id}
                    className="btn btn-secondary btn-xs bg-slate-800 hover:bg-slate-750 text-[10px] font-bold"
                  >
                    {processingId === s.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    Run Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-slate-550 border border-dashed border-slate-800 rounded-2xl space-y-3 bg-slate-900/5">
          <Calendar className="h-12 w-12 text-slate-700" />
          <h4 className="text-slate-350 font-semibold">No recurring schedules set up</h4>
          <p className="text-xs max-w-sm text-center">Define repeating expenses like monthly shop rent, internet bill plans, salaries, or subscription accounts.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-850 p-4 rounded-xl">
          <span className="text-xs text-slate-450">{totalRecords} templates registered</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="btn btn-secondary btn-sm">Previous</button>
            <span className="text-xs text-slate-300 px-2 font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="btn btn-secondary btn-sm">Next</button>
          </div>
        </div>
      )}

      {/* Schedule creation/editing Form Modal */}
      <RecurringForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchAll}
        schedule={selectedSchedule}
      />
    </div>
  );
}
export default Recurring;
