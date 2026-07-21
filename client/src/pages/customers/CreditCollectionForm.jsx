import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { customerApi } from '../../api/customer.api';

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerCreditId: z.string().optional().nullable().or(z.literal('')),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  referenceNo: z.string().max(100).optional().nullable().or(z.literal('')),
  notes: z.string().max(500).optional().nullable().or(z.literal('')),
});

const today = () => new Date().toISOString().split('T')[0];

export function CreditCollectionForm({ isOpen, onClose, onSuccess, prefillCustomerId = null, prefillCreditId = null }) {
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: prefillCustomerId || '',
      customerCreditId: prefillCreditId || '',
      collectionDate: today(),
      amount: '',
      paymentMode: 'CASH',
      referenceNo: '',
      notes: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedCreditId = watch('customerCreditId');

  useEffect(() => {
    if (isOpen) {
      customerApi.getCustomers({ limit: 100 }).then((r) => {
        setCustomers(r.data?.customers || []);
      });
      reset({
        customerId: prefillCustomerId || '',
        customerCreditId: prefillCreditId || '',
        collectionDate: today(),
        amount: '',
        paymentMode: 'CASH',
        referenceNo: '',
        notes: '',
      });
    }
  }, [isOpen, prefillCustomerId, prefillCreditId, reset]);

  // Load customer credits when customer selection changes
  useEffect(() => {
    if (selectedCustomerId) {
      customerApi.getCredits({ customerId: selectedCustomerId, limit: 100 }).then((r) => {
        const activeCredits = (r.data?.credits || []).filter((c) => c.status !== 'PAID');
        setCredits(activeCredits);
      });
    } else {
      setCredits([]);
      setValue('customerCreditId', '');
    }
  }, [selectedCustomerId, setValue]);

  // Auto fill amount when specific credit is chosen
  useEffect(() => {
    if (selectedCreditId) {
      const credit = credits.find((c) => c.id === selectedCreditId);
      if (credit) {
        const outstanding = Number(credit.amount) - Number(credit.paidAmount);
        setValue('amount', outstanding.toFixed(2));
      }
    }
  }, [selectedCreditId, credits, setValue]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        customerId: data.customerId,
        customerCreditId: data.customerCreditId || null,
        collectionDate: data.collectionDate,
        amount: parseFloat(data.amount),
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo || null,
        notes: data.notes || null,
      };

      await customerApi.createCollection(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record collection receipt.');
    } finally {
      setLoading(false);
    }
  };

  const currentCredit = credits.find((c) => c.id === selectedCreditId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment Collection">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Select Customer *</label>
          <select
            {...register('customerId')}
            className={`input ${errors.customerId ? 'input-error' : ''}`}
            disabled={!!prefillCustomerId}
          >
            <option value="">— Select Customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="text-xs text-red-455 mt-1">{errors.customerId.message}</p>}
        </div>

        {selectedCustomerId && (
          <div className="input-group">
            <label className="input-label">Link to Credit Invoice (Optional)</label>
            <select
              {...register('customerCreditId')}
              className={`input ${errors.customerCreditId ? 'input-error' : ''}`}
              disabled={!!prefillCreditId}
            >
              <option value="">— General payment (no specific credit link) —</option>
              {credits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.description} — Outstanding ₹{(Number(c.amount) - Number(c.paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
            {errors.customerCreditId && <p className="text-xs text-red-455 mt-1">{errors.customerCreditId.message}</p>}
            {currentCredit && (
              <p className="text-[11px] text-slate-400 mt-1">
                Total Credit amount: ₹{Number(currentCredit.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} — Paid to date: ₹{Number(currentCredit.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Collection Date *</label>
            <input
              type="date"
              {...register('collectionDate')}
              className={`input ${errors.collectionDate ? 'input-error' : ''}`}
            />
            {errors.collectionDate && <p className="text-xs text-red-455 mt-1">{errors.collectionDate.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Amount Collected (₹) *</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-red-455 mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Payment Mode *</label>
            <select
              {...register('paymentMode')}
              className={`input ${errors.paymentMode ? 'input-error' : ''}`}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.paymentMode && <p className="text-xs text-red-455 mt-1">{errors.paymentMode.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Reference Number / Txn ID</label>
            <input
              type="text"
              {...register('referenceNo')}
              className={`input ${errors.referenceNo ? 'input-error' : ''}`}
              placeholder="UPI Ref, Cheque No, etc."
            />
            {errors.referenceNo && <p className="text-xs text-red-455 mt-1">{errors.referenceNo.message}</p>}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Notes</label>
          <textarea
            rows="2"
            {...register('notes')}
            className={`input ${errors.notes ? 'input-error' : ''}`}
            style={{ height: 'auto', padding: '10px 12px' }}
            placeholder="Optional collection details..."
          />
          {errors.notes && <p className="text-xs text-red-455 mt-1">{errors.notes.message}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary font-semibold">
            {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
            Record Receipt
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default CreditCollectionForm;
