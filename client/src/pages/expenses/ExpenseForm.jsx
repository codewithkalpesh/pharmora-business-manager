// src/pages/expenses/ExpenseForm.jsx
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { expenseApi } from '../../api/expense.api';
import { bankApi } from '../../api/bank.api';
import { Loader2, Upload, Paperclip, Building2 } from 'lucide-react';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  sectionLabelStyle, errorBannerStyle, formFooterStyle, useInputStyle,
} from '../../components/common/FormField';

const formSchema = z.object({
  date: z.string().nonempty('Date is required'),
  categoryId: z.string().nonempty('Category is required'),
  description: z.string().min(3, 'At least 3 characters'),
  amount: z.coerce.number().positive('Must be positive'),
  paymentMode: z.string().default('CASH'),
  bankAccountId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

export default function ExpenseForm({ initialData, onSuccess, onClose }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseApi.getCategories().then((r) => r.data.data),
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank-accounts-active'],
    queryFn: () => bankApi.getAccounts({ isActive: 'true', limit: 50 }).then((r) => r.data.accounts),
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: new Date(initialData.date).toISOString().split('T')[0],
          categoryId: initialData.categoryId,
          description: initialData.description,
          amount: Number(initialData.amount),
          paymentMode: initialData.paymentMode,
          bankAccountId: initialData.bankAccountId || '',
          isRecurring: !!initialData.isRecurring,
          notes: initialData.notes || '',
        }
      : {
          date: new Date().toISOString().split('T')[0],
          categoryId: '', description: '', amount: '',
          paymentMode: 'CASH', bankAccountId: '',
          isRecurring: false, notes: '',
        },
  });

  const paymentMode = useWatch({ control, name: 'paymentMode' });
  const showBankSelector = paymentMode && paymentMode !== 'CASH';
  const inp = useInputStyle(errors);

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('date', values.date);
    formData.append('categoryId', values.categoryId);
    formData.append('description', values.description);
    formData.append('amount', values.amount);
    formData.append('paymentMode', values.paymentMode);
    formData.append('isRecurring', values.isRecurring);
    formData.append('notes', values.notes || '');
    if (values.paymentMode !== 'CASH' && values.bankAccountId) {
      formData.append('bankAccountId', values.bankAccountId);
    }
    if (selectedFile) formData.append('receipt', selectedFile);
    try {
      if (isEdit) {
        await expenseApi.update(initialData.id, formData);
      } else {
        await expenseApi.create(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* Description – full width */}
      <FormField label="Expense Description *" error={errors.description?.message}>
        <input
          type="text"
          placeholder="e.g. Office rent, Printer ink"
          {...register('description')}
          {...inp()}
        />
      </FormField>

      <div style={{ height: 12 }} />

      {/* Row 1: Date + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="Date *" error={errors.date?.message}>
          <input type="date" {...register('date')} {...inp()} />
        </FormField>
        <FormField label="Category *" error={errors.categoryId?.message}>
          <select {...register('categoryId')} style={{ ...selectBase, ...(errors.categoryId ? { borderColor: '#ef4444' } : {}) }}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Row 2: Amount + Payment Mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="Amount (₹) *" error={errors.amount?.message}>
          <input type="number" step="0.01" placeholder="0.00" {...register('amount')} {...inp()} />
        </FormField>
        <FormField label="Payment Mode" error={errors.paymentMode?.message}>
          <select {...register('paymentMode')} style={selectBase}>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </FormField>
      </div>

      {/* Bank Account (conditional) */}
      {showBankSelector && (
        <div style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(245,158,11,0.05)', border: '1.5px solid rgba(245,158,11,0.15)', borderRadius: 12 }}>
          <FormField label="Pay From Bank Account" error={null}>
            {bankAccounts.length > 0 ? (
              <select {...register('bankAccountId')} style={selectBase}>
                <option value="">Select Bank Account</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} — {acc.accountName} (₹{Number(acc.currentBalance).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: '#d97706', margin: '4px 0 0' }}>
                No active bank accounts found. Add one in Banks first.
              </p>
            )}
          </FormField>
        </div>
      )}

      {/* Receipt Upload */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
          Receipt Attachment
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 56, borderRadius: 10, cursor: 'pointer',
          border: '1.5px dashed rgba(148,163,184,0.3)',
          background: '#f8fafc',
          color: selectedFile ? '#059669' : '#94a3b8',
          fontSize: '0.8125rem', fontWeight: 500,
          transition: 'border-color 0.15s',
        }}>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} style={{ display: 'none' }} />
          {selectedFile ? (
            <><Paperclip size={14} /><span className="truncate">{selectedFile.name}</span></>
          ) : (
            <><Upload size={14} /><span>Click to upload Image or PDF (max 5 MB)</span></>
          )}
        </label>
        {initialData?.receiptUrl && !selectedFile && (
          <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Paperclip size={12} /> Existing receipt attached
          </p>
        )}
      </div>

      {/* Recurring + Notes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <input
          type="checkbox"
          id="isRecurring"
          {...register('isRecurring')}
          style={{ accentColor: '#10b981', width: 15, height: 15, cursor: 'pointer' }}
        />
        <label htmlFor="isRecurring" style={{ fontSize: '0.8125rem', color: '#475569', cursor: 'pointer' }}>
          Recurring monthly expense (e.g. Rent, Internet)
        </label>
      </div>

      <FormField label="Notes" error={null}>
        <textarea
          rows="2"
          placeholder="Additional details..."
          {...register('notes')}
          style={{ ...inputBase, height: 'auto', padding: '8px 10px', resize: 'none' }}
          onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(148,163,184,0.2)'; e.target.style.boxShadow = 'none'; }}
        />
      </FormField>

      <div style={formFooterStyle}>
        <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}>
          {loading && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? 'Save Changes' : 'Record Expense'}
        </button>
      </div>
    </form>
  );
}
