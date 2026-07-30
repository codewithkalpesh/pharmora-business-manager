import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Plus, Search, ShoppingCart, Receipt, HandCoins, CheckCircle2,
  AlertCircle, Trash2, PlusCircle, TrendingUp, Calendar, Loader2, ArrowRight, Check
} from 'lucide-react';
import differenceInDays from 'date-fns/differenceInDays';
import { goalApi } from '../../api/goal.api';
import GoalFormModal from './GoalFormModal';
import AddMoneyModal from './AddMoneyModal';
import { KPICard } from '../../components/common/KPICard';
import Modal from '../../components/common/Modal';

export default function Goals() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoalForAdd, setSelectedGoalForAdd] = useState(null);
  const [historyGoal, setHistoryGoal] = useState(null);

  // Fetch Goals
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['goals', activeTab, search],
    queryFn: () => {
      const params = {};
      if (activeTab === 'COMPLETED') {
        params.status = 'COMPLETED';
      } else if (activeTab !== 'ALL') {
        params.category = activeTab;
      }
      if (search) params.search = search;
      return goalApi.getGoals(params).then((r) => r.data);
    },
  });

  const goals = resData?.data || [];
  const stats = resData?.stats || { totalGoals: 0, activeCount: 0, completedCount: 0, totalTarget: 0, totalSaved: 0 };

  // Delete Goal Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => goalApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this payment goal?')) {
      deleteMutation.mutate(id);
    }
  };

  const categoryIcons = {
    PURCHASE: ShoppingCart,
    EXPENSE: Receipt,
    BORROWED_MONEY: HandCoins,
    GENERAL: Target,
  };

  const categoryColors = {
    PURCHASE: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', color: '#2563eb', label: 'Purchases' },
    EXPENSE: { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.2)', color: '#db2777', label: 'Expense' },
    BORROWED_MONEY: { bg: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04', label: 'Borrowed' },
    GENERAL: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', color: '#059669', label: 'General' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Target className="text-emerald-500" size={26} />
            Payment Goals & Target Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Set payment goals for distributors, expenses, and borrowed money with progress tracking.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="btn btn-primary flex items-center justify-center gap-2 px-4 py-2.5 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          <span>Create Payment Goal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Payment Goals"
          value={stats.activeCount}
          format="number"
          subtitle={`Out of ${stats.totalGoals} total goals`}
          icon={Target}
          iconColor="#3b82f6"
        />
        <KPICard
          label="Total Target Amount"
          value={stats.totalTarget}
          format="currency"
          subtitle="Target for active goals"
          icon={TrendingUp}
          iconColor="#8b5cf6"
        />
        <KPICard
          label="Total Funds Saved"
          value={stats.totalSaved}
          format="currency"
          subtitle={`${stats.totalTarget > 0 ? Math.round((stats.totalSaved / stats.totalTarget) * 100) : 0}% of target saved`}
          icon={PlusCircle}
          iconColor="#10b981"
        />
        <KPICard
          label="Goals Completed"
          value={stats.completedCount}
          format="number"
          subtitle="Fully funded & paid goals"
          icon={CheckCircle2}
          iconColor="#06b6d4"
        />
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'ALL', label: 'All Active Goals' },
            { id: 'PURCHASE', label: 'Purchases (Distributors)' },
            { id: 'EXPENSE', label: 'Expenses' },
            { id: 'BORROWED_MONEY', label: 'Borrowed Money' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading payment goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Target size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-200">No payment goals found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Create goals for distributor bills, upcoming expenses, or borrowed money to track savings and target deadlines.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary text-xs mt-4 px-4 py-2"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const target = Number(goal.targetAmount);
            const saved = Number(goal.savedAmount);
            const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
            const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
            const Icon = categoryIcons[goal.category] || Target;
            const catMeta = categoryColors[goal.category] || categoryColors.GENERAL;
            const isCompleted = goal.status === 'COMPLETED' || saved >= target;

            return (
              <div
                key={goal.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  {/* Goal Top row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ background: catMeta.bg, border: `1px solid ${catMeta.border}`, color: catMeta.color }}
                    >
                      <Icon size={12} />
                      {catMeta.label}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : daysLeft < 0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : daysLeft <= 3
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted
                        ? 'COMPLETED 🎉'
                        : daysLeft < 0
                        ? `Overdue (${Math.abs(daysLeft)}d)`
                        : daysLeft === 0
                        ? 'Due Today!'
                        : `Due in ${daysLeft} days`}
                    </span>
                  </div>

                  {/* Goal Title & Subtitle */}
                  <h3 className="text-base font-extrabold text-slate-100 leading-snug line-clamp-2 mb-1">
                    {goal.title}
                  </h3>

                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-4">
                    <Calendar size={13} className="text-slate-500" />
                    Target Date: {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>

                  {/* Linked entity badge */}
                  {(goal.distributor || goal.expenseCategory || goal.borrowedMoney || goal.bill) && (
                    <div className="bg-slate-800/50 rounded-xl p-2.5 mb-4 text-xs text-slate-300 border border-slate-800/80">
                      {goal.distributor && (
                        <div>Distributor: <strong className="text-slate-100">{goal.distributor.name}</strong></div>
                      )}
                      {goal.bill && (
                        <div className="text-[11px] text-slate-400 mt-0.5">Linked Bill Invoice: #{goal.bill.invoiceNo || 'N/A'}</div>
                      )}
                      {goal.expenseCategory && (
                        <div>Category: <strong className="text-slate-100">{goal.expenseCategory.name}</strong></div>
                      )}
                      {goal.borrowedMoney && (
                        <div>Payee: <strong className="text-slate-100">{goal.borrowedMoney.personName}</strong></div>
                      )}
                    </div>
                  )}

                  {/* Progress Bar & Amount */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        Saved: <strong className="text-emerald-400">₹{saved.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className="text-slate-100 font-extrabold">
                        Target: ₹{target.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : daysLeft <= 2
                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  {!isCompleted && (
                    <button
                      onClick={() => setSelectedGoalForAdd(goal)}
                      className="flex-1 btn btn-primary text-xs py-2 flex items-center justify-center gap-1.5 font-bold"
                    >
                      <PlusCircle size={14} />
                      Add Money
                    </button>
                  )}

                  <button
                    onClick={() => setHistoryGoal(goal)}
                    className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                    title="View contributions"
                  >
                    History
                  </button>

                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="btn btn-ghost text-red-400 hover:bg-red-500/10 p-2 rounded-xl"
                    title="Delete goal"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['goals']);
        }}
      />

      {/* Add Money Modal */}
      {selectedGoalForAdd && (
        <AddMoneyModal
          isOpen={!!selectedGoalForAdd}
          onClose={() => setSelectedGoalForAdd(null)}
          goal={selectedGoalForAdd}
          onSuccess={() => {
            queryClient.invalidateQueries(['goals']);
          }}
        />
      )}

      {/* Contributions History Modal */}
      {historyGoal && (
        <Modal
          isOpen={!!historyGoal}
          onClose={() => setHistoryGoal(null)}
          title={`Contribution History: ${historyGoal.title}`}
        >
          <div className="space-y-3">
            {historyGoal.contributions && historyGoal.contributions.length > 0 ? (
              historyGoal.contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                  <div>
                    <div className="font-bold text-slate-100">Saved +₹{Number(c.amount).toLocaleString('en-IN')}</div>
                    {c.notes && <div className="text-slate-400 mt-0.5">{c.notes}</div>}
                  </div>
                  <div className="text-slate-400 text-right">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No funds added to this goal yet.</div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
