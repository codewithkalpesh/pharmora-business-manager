// src/pages/borrowed/RepaymentHistoryModal.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import { Trash2, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export function RepaymentHistoryModal({ isOpen, onClose, item, onDeleteRepayment }) {
  if (!item) return null;

  const repayments = item.repayments || [];
  const remaining = Math.max(0, Number(item.targetAmount) - Number(item.paidAmount));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`History: ${item.personName}`}
      size="lg"
    >
      {/* Overview Stats */}
      <div
        style={{
          padding: '14px 16px',
          marginBottom: 16,
          background: '#f8fafc',
          border: '1.5px solid rgba(148,163,184,0.2)',
          borderRadius: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Borrowed
          </span>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
            {formatCurrency(item.borrowedAmount)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Target Payback
          </span>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#d97706' }}>
            {formatCurrency(item.targetAmount)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Repaid
          </span>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>
            {formatCurrency(item.paidAmount)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Remaining Due
          </span>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: remaining > 0 ? '#ef4444' : '#64748b' }}>
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>

      {/* History Stream */}
      <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
        {/* Initial Borrowing Entry */}
        <div
          style={{
            padding: 14,
            marginBottom: 12,
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1.5px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ padding: 6, borderRadius: 8, background: '#d1fae5', color: '#047857' }}>
            <ArrowDownLeft size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                Money Received (Borrowed)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(item.borrowDate)}</span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
              Received {formatCurrency(item.borrowedAmount)} from {item.personName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4, display: 'flex', gap: 14 }}>
              <span>Mode: <strong>{item.paymentMode}</strong></span>
              {item.targetDate && (
                <span style={{ color: '#b45309', fontWeight: 600 }}>
                  Target Due: {formatDate(item.targetDate)}
                </span>
              )}
            </div>
            {item.notes && (
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 6, background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)' }}>
                {item.notes}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, marginTop: 14 }}>
          Repayments Made ({repayments.length})
        </div>

        {repayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.8125rem' }}>
            No repayments recorded yet for this record.
          </div>
        ) : (
          repayments.map((rep) => (
            <div
              key={rep.id}
              style={{
                padding: 14,
                marginBottom: 10,
                background: '#f8fafc',
                border: '1.5px solid rgba(148,163,184,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ padding: 6, borderRadius: 8, background: '#fef3c7', color: '#b45309' }}>
                <ArrowUpRight size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                    Repayment Paid
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(rep.repaymentDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a' }}>
                    {formatCurrency(rep.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteRepayment(rep.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                    title="Delete repayment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4, display: 'flex', gap: 14 }}>
                  <span>Mode: <strong>{rep.paymentMode}</strong></span>
                  {rep.referenceNo && <span>Ref: <code>{rep.referenceNo}</code></span>}
                </div>
                {rep.notes && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 6, background: '#ffffff', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)' }}>
                    {rep.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 14, borderTop: '1px solid rgba(148,163,184,0.15)' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Status: <strong style={{ color: '#0f172a' }}>{item.displayStatus || item.status}</strong>
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0 18px',
            height: 36,
            borderRadius: 10,
            cursor: 'pointer',
            background: '#f1f5f9',
            border: '1px solid rgba(148,163,184,0.2)',
            color: '#334155',
            fontSize: '0.8125rem',
            fontWeight: 700,
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
