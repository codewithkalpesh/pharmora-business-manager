import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Target, PlusCircle, ArrowRight, ShoppingCart, Receipt,
  HandCoins, Flame, Clock, TrendingUp, Zap,
} from 'lucide-react';
import differenceInDays from 'date-fns/differenceInDays';
import { goalApi } from '../../api/goal.api';
import AddMoneyModal from '../../pages/goals/AddMoneyModal';

/* ─── Theme palette per card slot ─── */
const THEMES = [
  {
    id: 'violet',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)',
    glow: 'rgba(139, 92, 246, 0.35)',
    chip: 'rgba(255,255,255,0.18)',
    chipText: '#f3e8ff',
    bar: '#c4b5fd',
    barTrack: 'rgba(255,255,255,0.15)',
    daysUrgent: '#fde68a',
    daysNormal: '#ddd6fe',
    icon: '#ede9fe',
    title: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    amt: '#ffffff',
    amtSub: 'rgba(255,255,255,0.65)',
    btnBg: 'rgba(255,255,255,0.15)',
    btnHover: 'rgba(255,255,255,0.25)',
    btnText: '#ffffff',
    btnBorder: 'rgba(255,255,255,0.25)',
  },
  {
    id: 'emerald',
    gradient: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
    glow: 'rgba(16, 185, 129, 0.35)',
    chip: 'rgba(255,255,255,0.18)',
    chipText: '#d1fae5',
    bar: '#6ee7b7',
    barTrack: 'rgba(255,255,255,0.15)',
    daysUrgent: '#fde68a',
    daysNormal: '#a7f3d0',
    icon: '#d1fae5',
    title: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    amt: '#ffffff',
    amtSub: 'rgba(255,255,255,0.65)',
    btnBg: 'rgba(255,255,255,0.15)',
    btnHover: 'rgba(255,255,255,0.25)',
    btnText: '#ffffff',
    btnBorder: 'rgba(255,255,255,0.25)',
  },
  {
    id: 'rose',
    gradient: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #fb7185 100%)',
    glow: 'rgba(225, 29, 72, 0.35)',
    chip: 'rgba(255,255,255,0.18)',
    chipText: '#ffe4e6',
    bar: '#fda4af',
    barTrack: 'rgba(255,255,255,0.15)',
    daysUrgent: '#fef08a',
    daysNormal: '#fecdd3',
    icon: '#ffe4e6',
    title: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    amt: '#ffffff',
    amtSub: 'rgba(255,255,255,0.65)',
    btnBg: 'rgba(255,255,255,0.15)',
    btnHover: 'rgba(255,255,255,0.25)',
    btnText: '#ffffff',
    btnBorder: 'rgba(255,255,255,0.25)',
  },
  {
    id: 'amber',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #fbbf24 100%)',
    glow: 'rgba(217, 119, 6, 0.35)',
    chip: 'rgba(255,255,255,0.18)',
    chipText: '#fef3c7',
    bar: '#fcd34d',
    barTrack: 'rgba(255,255,255,0.15)',
    daysUrgent: '#fef08a',
    daysNormal: '#fde68a',
    icon: '#fef3c7',
    title: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    amt: '#ffffff',
    amtSub: 'rgba(255,255,255,0.65)',
    btnBg: 'rgba(255,255,255,0.15)',
    btnHover: 'rgba(255,255,255,0.25)',
    btnText: '#ffffff',
    btnBorder: 'rgba(255,255,255,0.25)',
  },
  {
    id: 'cyan',
    gradient: 'linear-gradient(135deg, #164e63 0%, #0891b2 50%, #22d3ee 100%)',
    glow: 'rgba(8, 145, 178, 0.35)',
    chip: 'rgba(255,255,255,0.18)',
    chipText: '#cffafe',
    bar: '#67e8f9',
    barTrack: 'rgba(255,255,255,0.15)',
    daysUrgent: '#fde68a',
    daysNormal: '#a5f3fc',
    icon: '#cffafe',
    title: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    amt: '#ffffff',
    amtSub: 'rgba(255,255,255,0.65)',
    btnBg: 'rgba(255,255,255,0.15)',
    btnHover: 'rgba(255,255,255,0.25)',
    btnText: '#ffffff',
    btnBorder: 'rgba(255,255,255,0.25)',
  },
];

const CAT_META = {
  PURCHASE: { label: 'Purchase', Icon: ShoppingCart },
  EXPENSE: { label: 'Expense', Icon: Receipt },
  BORROWED_MONEY: { label: 'Borrowed', Icon: HandCoins },
  GENERAL: { label: 'Goal', Icon: Target },
};

function UrgencyBadge({ daysLeft, theme }) {
  const isOverdue = daysLeft < 0;
  const isDueToday = daysLeft === 0;
  const isUrgent = daysLeft <= 2 && daysLeft >= 0;

  const color = isOverdue || isDueToday ? theme.daysUrgent : theme.daysNormal;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 20,
        background: 'rgba(0,0,0,0.25)',
        color,
        fontSize: '0.6875rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${color}30`,
      }}
    >
      {(isOverdue || isDueToday || isUrgent) && <Flame size={10} style={{ color }} />}
      {isOverdue
        ? `${Math.abs(daysLeft)}d Overdue`
        : isDueToday
        ? 'Due Today!'
        : `${daysLeft}d left`}
    </div>
  );
}

function GoalCard({ goal, index, onAddMoney }) {
  const [hovered, setHovered] = useState(false);
  const theme = THEMES[index % THEMES.length];
  const target = Number(goal.targetAmount);
  const saved = Number(goal.savedAmount);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
  const catInfo = CAT_META[goal.category] || CAT_META.GENERAL;
  const { Icon } = catInfo;
  const isCompleted = pct >= 100;
  const subLabel =
    goal.distributor?.name ||
    goal.borrowedMoney?.personName ||
    goal.expenseCategory?.name ||
    null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.gradient,
        borderRadius: 20,
        padding: '18px 18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        boxShadow: hovered
          ? `0 20px 40px -8px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.08)`
          : `0 8px 24px -4px ${theme.glow}, 0 0 0 1px rgba(255,255,255,0.06)`,
        transform: hovered ? 'translateY(-4px) scale(1.012)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
      }}
    >
      {/* Decorative orb */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          left: -15,
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Row: Category chip + Days Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            background: theme.chip,
            color: theme.chipText,
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <Icon size={11} />
          {catInfo.label}
        </div>

        {isCompleted ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(0,0,0,0.25)',
              color: '#bbf7d0',
              fontSize: '0.6875rem',
              fontWeight: 800,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Zap size={10} /> Done 🎉
          </div>
        ) : (
          <UrgencyBadge daysLeft={daysLeft} theme={theme} />
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '0.9375rem',
          fontWeight: 800,
          color: theme.title,
          lineHeight: 1.3,
          marginBottom: subLabel ? 4 : 10,
          letterSpacing: '-0.01em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {goal.title || catInfo.label + ' Goal'}
      </div>

      {/* Sub-label (distributor / payee / category) */}
      {subLabel && (
        <div
          style={{
            fontSize: '0.75rem',
            color: theme.sub,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Clock size={11} style={{ opacity: 0.7 }} />
          {subLabel}
        </div>
      )}

      {/* Amounts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: '0.6875rem', color: theme.amtSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>
            Saved
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 900, color: theme.amt, lineHeight: 1 }}>
            ₹{saved.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6875rem', color: theme.amtSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>
            Target
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: theme.amt, opacity: 0.9 }}>
            ₹{target.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            height: 7,
            borderRadius: 10,
            background: theme.barTrack,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: theme.bar,
              borderRadius: 10,
              transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: `0 0 8px ${theme.bar}80`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: theme.bar }}>
            {pct}% funded
          </span>
        </div>
      </div>

      {/* Add Money Button */}
      {!isCompleted && (
        <button
          onClick={() => onAddMoney(goal)}
          style={{
            width: '100%',
            padding: '9px 14px',
            borderRadius: 12,
            border: `1.5px solid ${theme.btnBorder}`,
            background: hovered ? theme.btnHover : theme.btnBg,
            color: theme.btnText,
            fontSize: '0.8125rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            backdropFilter: 'blur(6px)',
            transition: 'background 0.2s ease',
            letterSpacing: '0.01em',
            marginTop: 'auto',
          }}
        >
          <PlusCircle size={15} />
          Add Money
        </button>
      )}
    </div>
  );
}

export function GoalStickyNotes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedGoalForMoney, setSelectedGoalForMoney] = useState(null);

  const { data: resData, isLoading } = useQuery({
    queryKey: ['active-goals-sticky'],
    queryFn: () => goalApi.getGoals({ status: 'IN_PROGRESS', limit: 1 }).then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const activeGoals = resData?.data || [];

  if (isLoading || activeGoals.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* ── Section Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
              fontSize: 17,
            }}
          >
            📌
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              Upcoming Payment Goals
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 500 }}>
              Next upcoming goal — stay on track
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/goals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            border: '1px solid rgba(100,116,139,0.25)',
            background: 'rgba(30,41,59,0.8)',
            color: '#94a3b8',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e2e8f0';
            e.currentTarget.style.borderColor = 'rgba(100,116,139,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(100,116,139,0.25)';
          }}
        >
          <TrendingUp size={13} />
          View All Goals
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ── Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        {activeGoals.slice(0, 1).map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={index}
            onAddMoney={(g) => setSelectedGoalForMoney(g)}
          />
        ))}
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
            setSelectedGoalForMoney(null);
          }}
        />
      )}
    </div>
  );
}

export default GoalStickyNotes;
