import React, { useState, useEffect } from 'react';
import { Loader2, PlusCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { goalApi } from '../../api/goal.api';
import {
  FormField, inputBase, cancelBtnStyle, submitBtnStyle, errorBannerStyle, formFooterStyle,
} from '../../components/common/FormField';

export default function AddMoneyModal({ isOpen, onClose, goal, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!goal) return null;

  const currentSaved = Number(goal.savedAmount || 0);
  const target = Number(goal.targetAmount || 0);
  const added = Number(amount) || 0;
  const newTotal = currentSaved + added;
  const remaining = Math.max(0, target - newTotal);
  const currentPct = target > 0 ? Math.min(100, Math.round((currentSaved / target) * 100)) : 0;
  const newPct = target > 0 ? Math.min(100, Math.round((newTotal / target) * 100)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || added <= 0) {
      setError('Please enter a valid amount to add.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await goalApi.addContribution(goal.id, {
        amount: added,
        notes: notes || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add money to goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Money to Goal: ${goal.title}`}>
      <form onSubmit={handleSubmit}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* Current Progress & Preview Strip */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Target: <strong>₹{target.toLocaleString('en-IN')}</strong></span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>
              Current: ₹{currentSaved.toLocaleString('en-IN')} ({currentPct}%)
            </span>
          </div>

          {/* Dual Progress bar */}
          <div
            style={{
              height: 10,
              width: '100%',
              borderRadius: 5,
              background: 'rgba(148,163,184,0.2)',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${currentPct}%`,
                background: '#10b981',
                borderRadius: 5,
                transition: 'width 0.3s ease',
              }}
            />
            {added > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${currentPct}%`,
                  height: '100%',
                  width: `${Math.min(100 - currentPct, newPct - currentPct)}%`,
                  background: '#3b82f6',
                  borderRadius: '0 5px 5px 0',
                  transition: 'all 0.3s ease',
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: added > 0 ? '#2563eb' : 'var(--text-muted)', fontWeight: 600 }}>
              {added > 0 ? `New Total: ₹${newTotal.toLocaleString('en-IN')} (${newPct}%)` : 'Enter amount below'}
            </span>
            <span style={{ color: remaining === 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
              {remaining === 0 ? 'Goal Will Be Completed! 🎉' : `Remaining: ₹${remaining.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>

        {/* Input amount */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Amount to Add (₹) *" error={null}>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputBase}
              autoFocus
            />
          </FormField>
        </div>

        <div style={{ marginBottom: 12 }}>
          <FormField label="Notes / Transaction Remark (Optional)" error={null}>
            <input
              type="text"
              placeholder="e.g. Saved from today's cash sales"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={inputBase}
            />
          </FormField>
        </div>

        <div style={formFooterStyle}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={loading || !amount} style={{ ...submitBtnStyle, opacity: loading || !amount ? 0.7 : 1 }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
            Save Funds
          </button>
        </div>
      </form>
    </Modal>
  );
}
