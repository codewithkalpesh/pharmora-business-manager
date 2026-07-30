import React, { useEffect, useState } from 'react';
import { Target, Calendar, AlertTriangle, CheckCircle2, ArrowRight, X, PlusCircle, ShoppingCart, Receipt, HandCoins } from 'lucide-react';
import { goalApi } from '../../api/goal.api';
import AddMoneyModal from '../../pages/goals/AddMoneyModal';
import differenceInDays from 'date-fns/differenceInDays';

export function DailyGoalAlertModal() {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGoalForMoney, setSelectedGoalForMoney] = useState(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastAlertDate = localStorage.getItem('pharmora_last_goal_alert_date');

    if (lastAlertDate !== todayStr) {
      goalApi
        .getDailyAlerts()
        .then((res) => {
          const goals = res.data?.data || [];
          if (goals.length > 0) {
            setAlerts(goals);
            setIsOpen(true);
          }
        })
        .catch((err) => {
          console.error('Error fetching daily goal alerts:', err);
        });
    }
  }, []);

  const handleDismiss = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('pharmora_last_goal_alert_date', todayStr);
    setIsOpen(false);
  };

  if (!isOpen || alerts.length === 0) return null;

  const categoryIcons = {
    PURCHASE: ShoppingCart,
    EXPENSE: Receipt,
    BORROWED_MONEY: HandCoins,
    GENERAL: Target,
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.25s ease-out',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Daily Goal & Payment Alert 🎯
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, marginTop: 2 }}>
                  You have {alerts.length} payment target(s) due soon!
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                padding: 6,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Goal Alert Items list */}
          <div style={{ padding: 20, maxHeight: 380, overflowY: 'auto' }}>
            {alerts.map((goal) => {
              const target = Number(goal.targetAmount);
              const saved = Number(goal.savedAmount);
              const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
              const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
              const Icon = categoryIcons[goal.category] || Target;

              let isUrgent = daysLeft <= 2;

              return (
                <div
                  key={goal.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: isUrgent ? '1.5px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(148,163,184,0.15)',
                    background: isUrgent ? 'rgba(239, 68, 68, 0.03)' : '#f8fafc',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          padding: 5,
                          borderRadius: 6,
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{goal.title}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                          {goal.distributor?.name || goal.borrowedMoney?.personName || goal.expenseCategory?.name || 'Payment Target'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        background: daysLeft < 0 ? '#fee2e2' : isUrgent ? '#ffedd5' : '#e0f2fe',
                        color: daysLeft < 0 ? '#dc2626' : isUrgent ? '#c2410c' : '#0369a1',
                      }}
                    >
                      {daysLeft < 0
                        ? `Overdue by ${Math.abs(daysLeft)}d`
                        : daysLeft === 0
                        ? 'Due Today!'
                        : `Due in ${daysLeft} day(s)`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Saved: <strong>₹{saved.toLocaleString('en-IN')}</strong></span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>
                        Target: ₹{target.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 4,
                        background: '#e2e8f0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: isUrgent ? '#f97316' : '#10b981',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => setSelectedGoalForMoney(goal)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(16,185,129,0.3)',
                      background: 'rgba(16,185,129,0.08)',
                      color: '#059669',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <PlusCircle size={14} />
                    Add Money / Save Funds
                  </button>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 24px',
              background: '#f8fafc',
              borderTop: '1px solid rgba(148,163,184,0.15)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={handleDismiss}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Got it, Dismiss for Today
            </button>
          </div>
        </div>
      </div>

      {selectedGoalForMoney && (
        <AddMoneyModal
          isOpen={!!selectedGoalForMoney}
          onClose={() => setSelectedGoalForMoney(null)}
          goal={selectedGoalForMoney}
          onSuccess={() => {
            // refresh goals alerts list
            goalApi.getDailyAlerts().then((res) => setAlerts(res.data?.data || []));
          }}
        />
      )}
    </>
  );
}
export default DailyGoalAlertModal;
