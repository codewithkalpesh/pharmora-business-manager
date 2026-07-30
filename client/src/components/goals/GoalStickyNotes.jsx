import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Target, PlusCircle, Calendar, ArrowRight, ShoppingCart, Receipt, HandCoins, Pin } from 'lucide-react';
import differenceInDays from 'date-fns/differenceInDays';
import { goalApi } from '../../api/goal.api';
import AddMoneyModal from '../../pages/goals/AddMoneyModal';

export function GoalStickyNotes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedGoalForMoney, setSelectedGoalForMoney] = useState(null);

  const { data: resData, isLoading } = useQuery({
    queryKey: ['active-goals-sticky'],
    queryFn: () => goalApi.getGoals({ status: 'IN_PROGRESS', limit: 10 }).then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const activeGoals = resData?.data || [];

  if (isLoading || activeGoals.length === 0) return null;

  const categoryIcons = {
    PURCHASE: ShoppingCart,
    EXPENSE: Receipt,
    BORROWED_MONEY: HandCoins,
    GENERAL: Target,
  };

  const stickyThemes = [
    { bg: '#fef9c3', border: '#fef08a', text: '#713f12', tagBg: '#fef08a', tagText: '#854d0e', barBg: '#eab308' }, // Yellow
    { bg: '#ecfeff', border: '#a5f3fc', text: '#164e63', tagBg: '#cff4fc', tagText: '#0e7490', barBg: '#06b6d4' }, // Cyan
    { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', tagBg: '#dcfce7', tagText: '#15803d', barBg: '#10b981' }, // Green
    { bg: '#fdf2f8', border: '#fbcfe8', text: '#831843', tagBg: '#fce7f3', tagText: '#be185d', barBg: '#ec4899' }, // Pink
  ];

  return (
    <div className="mb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pin size={18} className="text-amber-500 transform -rotate-12" />
          <h2 className="text-sm font-extrabold text-slate-200 tracking-wide uppercase">
            Upcoming Payment Goals 📌
          </h2>
          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
            {activeGoals.length} Active
          </span>
        </div>

        <button
          onClick={() => navigate('/goals')}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          View All Goals 🎯
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Sticky Notes Scroll Row / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activeGoals.map((goal, index) => {
          const theme = stickyThemes[index % stickyThemes.length];
          const target = Number(goal.targetAmount);
          const saved = Number(goal.savedAmount);
          const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
          const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
          const Icon = categoryIcons[goal.category] || Target;

          return (
            <div
              key={goal.id}
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
                transform: index % 2 === 0 ? 'rotate(-0.8deg)' : 'rotate(0.8deg)',
              }}
              className="relative p-4 rounded-2xl border-2 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between"
            >
              {/* Pushpin decor */}
              <div className="absolute -top-2.5 right-4 text-amber-600 drop-shadow-sm">
                📌
              </div>

              <div>
                {/* Category & Urgency Badge */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    style={{ backgroundColor: theme.tagBg, color: theme.tagText }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Icon size={12} />
                    {goal.category}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      daysLeft < 0
                        ? 'bg-red-500 text-white'
                        : daysLeft === 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-black/10 text-slate-800'
                    }`}
                  >
                    {daysLeft < 0
                      ? `${Math.abs(daysLeft)}d Overdue`
                      : daysLeft === 0
                      ? 'Due Today!'
                      : `${daysLeft}d left`}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-sm leading-snug line-clamp-2 mb-1" style={{ color: theme.text }}>
                  {goal.title}
                </h3>

                {/* Subtitle / Payee info */}
                <p className="text-[11px] opacity-80 mb-3 truncate">
                  {goal.distributor?.name || goal.borrowedMoney?.personName || goal.expenseCategory?.name || 'Payment Goal'}
                </p>

                {/* Progress Bar & Amounts */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Saved: ₹{saved.toLocaleString('en-IN')}</span>
                    <span>Target: ₹{target.toLocaleString('en-IN')} ({pct}%)</span>
                  </div>

                  <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: theme.barBg }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add Money Button */}
              <button
                onClick={() => setSelectedGoalForMoney(goal)}
                style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                className="w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity mt-2"
              >
                <PlusCircle size={14} className="text-emerald-400" />
                Add Money ➕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Money Modal */}
      {selectedGoalForMoney && (
        <AddMoneyModal
          isOpen={!!selectedGoalForMoney}
          onClose={() => setSelectedGoalForMoney(null)}
          goal={selectedGoalForMoney}
          onSuccess={() => {
            queryClient.invalidateQueries(['active-goals-sticky']);
            queryClient.invalidateQueries(['goals']);
            queryClient.invalidateQueries(['dashboard-kpis']);
          }}
        />
      )}
    </div>
  );
}

export default GoalStickyNotes;
