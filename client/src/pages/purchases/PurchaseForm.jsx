// src/pages/purchases/PurchaseForm.jsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { purchaseApi } from '../../api/purchase.api';
import { Loader2 } from 'lucide-react';
import addDays from 'date-fns/addDays';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  sectionLabelStyle, errorBannerStyle, formFooterStyle, useInputStyle,
} from '../../components/common/FormField';

const billSchema = z.object({
  invoiceNo: z.string().nonempty('Invoice number is required'),
  distributorId: z.string().nonempty('Distributor is required'),
  billDate: z.string().nonempty('Bill date is required'),
  dueDate: z.string().nonempty('Due date is required'),
  subtotal: z.coerce.number().min(0, 'Must be positive'),
  gstAmount: z.coerce.number().min(0, 'Must be positive').default(0),
  discountAmount: z.coerce.number().min(0, 'Must be positive').default(0),
  paidAmount: z.coerce.number().min(0, 'Must be positive').default(0),
  notes: z.string().optional(),
});

export default function PurchaseForm({ initialData, onSuccess, onClose }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: distData } = useQuery({
    queryKey: ['distributors'],
    queryFn: () => purchaseApi.getDistributors({ limit: 100 }).then((r) => r.data.data),
  });
  const distributors = distData?.distributors || [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          billDate: new Date(initialData.billDate).toISOString().split('T')[0],
          dueDate: new Date(initialData.dueDate).toISOString().split('T')[0],
          subtotal: Number(initialData.subtotal),
          gstAmount: Number(initialData.gstAmount),
          discountAmount: Number(initialData.discountAmount),
          paidAmount: Number(initialData.paidAmount),
          notes: initialData.notes || '',
        }
      : {
          invoiceNo: '', distributorId: '',
          billDate: new Date().toISOString().split('T')[0],
          dueDate: '', subtotal: '', gstAmount: 0, discountAmount: 0, paidAmount: 0, notes: '',
        },
  });

  const watched = watch();
  const subtotal      = Number(watched.subtotal) || 0;
  const gstAmount     = Number(watched.gstAmount) || 0;
  const discountAmount= Number(watched.discountAmount) || 0;
  const grandTotal    = subtotal + gstAmount - discountAmount;
  const paidAmount    = Number(watched.paidAmount) || 0;
  const balanceDue    = Math.max(0, grandTotal - paidAmount);

  let status = 'PENDING';
  if (paidAmount >= grandTotal && grandTotal > 0) status = 'PAID';
  else if (paidAmount > 0) status = 'PARTIAL';

  useEffect(() => {
    if (!isEdit && watched.distributorId && watched.billDate) {
      const dist = distributors.find((d) => d.id === watched.distributorId);
      if (dist) {
        const due = addDays(new Date(watched.billDate), dist.creditDays || 30);
        setValue('dueDate', due.toISOString().split('T')[0]);
      }
    }
  }, [watched.distributorId, watched.billDate, distributors, isEdit, setValue]);

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await purchaseApi.updateBill(initialData.id, values);
      } else {
        await purchaseApi.createBill(values);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Check if this invoice is already logged.');
    } finally {
      setLoading(false);
    }
  };

  const inp = useInputStyle(errors);

  const statusColors = {
    PAID:    { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#059669' },
    PARTIAL: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#2563eb' },
    PENDING: { bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.18)', color: '#dc2626' },
  };
  const sc = statusColors[status];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* Row 1: Invoice + Distributor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="Invoice Number *" error={errors.invoiceNo?.message}>
          <input type="text" placeholder="e.g. GST-10394" {...register('invoiceNo')} {...inp()} />
        </FormField>
        <FormField label="Distributor / Supplier *" error={errors.distributorId?.message}>
          <select {...register('distributorId')} disabled={isEdit} style={{ ...selectBase, ...(errors.distributorId ? { borderColor: '#ef4444' } : {}), opacity: isEdit ? 0.6 : 1 }}>
            <option value="">Select Distributor</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Row 2: Bill Date + Due Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="Bill Date *" error={errors.billDate?.message}>
          <input type="date" {...register('billDate')} {...inp()} />
        </FormField>
        <FormField label="Payment Due Date *" error={errors.dueDate?.message}>
          <input type="date" {...register('dueDate')} {...inp()} />
        </FormField>
      </div>

      {/* Section: Amounts */}
      <p style={sectionLabelStyle('#3b82f6')}>Invoice Amounts</p>

      {/* Row 3: Bill Amount + Discount + Paid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <FormField label="Bill Amount (₹) *" error={errors.subtotal?.message}>
          <input type="number" step="0.01" placeholder="0.00" {...register('subtotal')} {...inp()} />
        </FormField>
        <FormField label="Discount Deduction" error={errors.discountAmount?.message}>
          <input type="number" step="0.01" placeholder="0.00" {...register('discountAmount')} {...inp()} />
        </FormField>
        <FormField label="Advance Paid Amount" error={errors.paidAmount?.message}>
          <input type="number" step="0.01" placeholder="0.00" {...register('paidAmount')} {...inp()} />
        </FormField>
      </div>

      {/* Summary strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 0, marginBottom: 14, borderRadius: 12,
        overflow: 'hidden', border: '1.5px solid rgba(148,163,184,0.12)',
      }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRight: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>₹{grandTotal.toFixed(2)}</div>
        </div>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRight: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Balance Due</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: balanceDue > 0 ? '#dc2626' : '#059669' }}>₹{balanceDue.toFixed(2)}</div>
        </div>
        <div style={{ padding: '10px 14px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
            color: sc.color, border: `1px solid ${sc.border}`, background: 'white', textTransform: 'uppercase',
          }}>
            {status}
          </span>
        </div>
      </div>

      {/* Notes */}
      <FormField label="Notes" error={null}>
        <textarea
          rows="2"
          placeholder="Medicines batch info or invoice remarks..."
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
          {isEdit ? 'Save Changes' : 'Log Purchase Invoice'}
        </button>
      </div>
    </form>
  );
}
