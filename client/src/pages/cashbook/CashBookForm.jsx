// src/pages/cashbook/CashBookForm.jsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cashBookApi } from '../../api/cashbook.api';
import { Loader2, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, PiggyBank, ArrowUpFromLine, DollarSign } from 'lucide-react';

const formSchema = z.object({
  date: z.string().nonempty('Date is required'),
  openingCash: z.coerce.number().min(0, 'Must be positive'),
  cashSales: z.coerce.number().min(0, 'Must be positive'),
  upiReceipts: z.coerce.number().min(0, 'Must be positive'),
  cardReceipts: z.coerce.number().min(0, 'Must be positive').default(0),
  otherIncome: z.coerce.number().min(0, 'Must be positive').default(0),
  totalExpenses: z.coerce.number().min(0, 'Must be positive').default(0),
  bankDeposit: z.coerce.number().min(0, 'Must be positive').default(0),
  closingCash: z.coerce.number().min(0, 'Must be positive'),
  notes: z.string().optional(),
});

// Compact styled input field
const Field = ({ label, icon: Icon, iconColor = '#10b981', error, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '0.6875rem', fontWeight: 600, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: 5,
    }}>
      {Icon && <Icon size={11} color={iconColor} />}
      {label}
    </label>
    {children}
    {error && <p style={{ fontSize: '0.6875rem', color: '#ef4444', marginTop: 3 }}>{error}</p>}
  </div>
);

const inputStyle = (hasError) => ({
  width: '100%',
  height: 38,
  padding: '0 10px',
  background: '#f8fafc',
  border: `1.5px solid ${hasError ? '#ef4444' : 'rgba(148,163,184,0.18)'}`,
  borderRadius: 10,
  color: '#0f172a',
  fontSize: '0.875rem',
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

const textareaStyle = {
  width: '100%',
  padding: '8px 10px',
  background: '#f8fafc',
  border: '1.5px solid rgba(148,163,184,0.18)',
  borderRadius: 10,
  color: '#0f172a',
  fontSize: '0.8125rem',
  resize: 'none',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  lineHeight: 1.5,
};

export default function CashBookForm({ initialData, onSuccess, onClose }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [fetchingOpening, setFetchingOpening] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: new Date(initialData.date).toISOString().split('T')[0],
          openingCash: Number(initialData.openingCash),
          cashSales: Number(initialData.cashSales),
          upiReceipts: Number(initialData.upiReceipts),
          cardReceipts: Number(initialData.cardReceipts),
          otherIncome: Number(initialData.otherIncome),
          totalExpenses: Number(initialData.totalExpenses),
          bankDeposit: Number(initialData.bankDeposit),
          closingCash: Number(initialData.closingCash),
          notes: initialData.notes || '',
        }
      : {
          date: new Date().toISOString().split('T')[0],
          openingCash: 0, cashSales: 0, upiReceipts: 0,
          cardReceipts: 0, otherIncome: 0, totalExpenses: 0,
          bankDeposit: 0, closingCash: 0, notes: '',
        },
  });

  const watched = watch();
  const openingCash   = Number(watched.openingCash) || 0;
  const cashSales     = Number(watched.cashSales) || 0;
  const closingCash   = Number(watched.closingCash) || 0;
  const totalExpenses = Number(watched.totalExpenses) || 0;
  const expectedClosing = openingCash + cashSales - totalExpenses;
  const difference    = closingCash - expectedClosing;

  useEffect(() => {
    const calculatedSales = Math.max(0, closingCash + totalExpenses - openingCash);
    setValue('cashSales', calculatedSales);
  }, [closingCash, totalExpenses, openingCash, setValue]);

  useEffect(() => {
    if (!isEdit && watched.date) {
      setFetchingOpening(true);
      cashBookApi.getEntryByDate(watched.date)
        .then(({ data }) => {
          if (data.success) {
            if (data.data.isNew) {
              setValue('openingCash', 0);
              setValue('totalExpenses', Number(data.data.suggestedTotalExpenses || 0));
            } else {
              setError(`An entry already exists for ${watched.date}. Close this and edit the existing entry.`);
            }
          }
        })
        .catch(console.error)
        .finally(() => setFetchingOpening(false));
    }
  }, [watched.date, isEdit, setValue]);

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...values,
        cardReceipts: 0,
        otherIncome: 0,
        totalExpenses: values.totalExpenses || 0,
        bankDeposit: 0,
        cashDifference: difference,
      };
      if (isEdit) {
        await cashBookApi.update(initialData.id, payload);
      } else {
        await cashBookApi.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const regWithFocus = (name, reg) => ({
    ...reg,
    onFocus: () => setFocusField(name),
    onBlur:  () => setFocusField(null),
    style: { ...inputStyle(!!errors[name]), ...(focusField === name ? { borderColor: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.1)' } : {}) },
  });

  const diffGreen  = difference === 0;
  const diffPlus   = difference > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#dc2626', fontSize: '0.8125rem',
        }}>
          {error}
        </div>
      )}

      {/* Section label */}
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Entry Details
      </p>

      {/* ── Row 1: Date + Opening ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Date" icon={DollarSign} iconColor="#64748b" error={errors.date?.message}>
          <input
            type="date"
            disabled={isEdit}
            {...register('date')}
            {...regWithFocus('date', register('date'))}
          />
        </Field>
        <Field label={fetchingOpening ? 'Opening Cash (loading…)' : 'Opening Cash'} icon={Wallet} iconColor="#10b981" error={errors.openingCash?.message}>
          <input type="number" step="0.01" {...regWithFocus('openingCash', register('openingCash'))} />
        </Field>
      </div>

      {/* ── Section: Receipts ── */}
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 4 }}>
        Receipts & Income
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Cash in Drawer" icon={PiggyBank} iconColor="#f59e0b" error={errors.closingCash?.message}>
          <input type="number" step="0.01" {...regWithFocus('closingCash', register('closingCash'))} />
        </Field>
        <Field label="UPI Receipts" icon={CreditCard} iconColor="#3b82f6" error={errors.upiReceipts?.message}>
          <input type="number" step="0.01" {...regWithFocus('upiReceipts', register('upiReceipts'))} />
        </Field>
      </div>

      {/* ── Section: Expenses ── */}
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 4 }}>
        Daily Outflows
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Total Expenses (Auto)" icon={TrendingDown} iconColor="#ef4444" error={errors.totalExpenses?.message}>
          <input
            type="number"
            step="0.01"
            readOnly
            style={{ ...inputStyle(false), color: '#64748b', cursor: 'not-allowed', background: '#f1f5f9' }}
            {...register('totalExpenses')}
          />
        </Field>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: 15, paddingLeft: 4 }}>
          ℹ️ Auto-filled from daily Expenses & Payments.
        </div>
      </div>

      {/* ── Cash Reconciliation Summary ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        background: '#f8fafc', borderRadius: 12, padding: '14px 16px',
        border: '1.5px solid rgba(148,163,184,0.14)', marginBottom: 14,
      }}>
        {/* Expected */}
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            Expected Closing
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{expectedClosing.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 2 }}>Calculated automatically</div>
        </div>

        {/* Auto Cash Sales */}
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            Calculated Cash Sales
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
            ₹{cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 2 }}>Drawer Cash + Expense - Opening</div>
        </div>
      </div>

      {/* Difference badge */}
      <div style={{
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
        background: diffGreen ? 'rgba(16,185,129,0.07)' : diffPlus ? 'rgba(59,130,246,0.07)' : 'rgba(239,68,68,0.07)',
        border: `1.5px solid ${diffGreen ? 'rgba(16,185,129,0.2)' : diffPlus ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
          {diffGreen ? '✅ Balanced' : diffPlus ? '📈 Overage' : '⚠️ Shortage'}
        </div>
        <div style={{
          fontSize: '0.9375rem', fontWeight: 800,
          color: diffGreen ? '#059669' : diffPlus ? '#2563eb' : '#dc2626',
        }}>
          {diffPlus ? '+' : ''}₹{Math.abs(difference).toFixed(2)}
        </div>
      </div>

      {/* Notes */}
      <Field label="Notes / Remarks" icon={null} error={null}>
        <textarea
          rows="2"
          {...register('notes')}
          placeholder="Any differences or special remarks..."
          style={textareaStyle}
          onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,0.18)'; e.target.style.boxShadow = 'none'; }}
        />
      </Field>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        paddingTop: 16, marginTop: 16,
        borderTop: '1px solid rgba(148,163,184,0.1)',
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0 18px', height: 38, borderRadius: 10, cursor: 'pointer',
            background: '#f1f5f9', border: '1px solid rgba(148,163,184,0.2)',
            color: '#475569', fontSize: '0.875rem', fontWeight: 600,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0 22px', height: 38, borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: 'white',
            fontSize: '0.875rem', fontWeight: 700,
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Save Changes' : 'Record Entry'}
        </button>
      </div>
    </form>
  );
}
