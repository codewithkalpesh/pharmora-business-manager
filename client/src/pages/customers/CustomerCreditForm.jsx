import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { customerApi } from '../../api/customer.api';

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: z.string().min(1, 'Description/Item details is required').max(200),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').or(z.literal('')).optional().nullable(),
  notes: z.string().max(500).optional().nullable().or(z.literal('')),
});

const today = () => new Date().toISOString().split('T')[0];

export function CustomerCreditForm({ isOpen, onClose, onSuccess, prefillCustomerId = null }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: prefillCustomerId || '',
      date: today(),
      description: '',
      amount: '',
      dueDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      customerApi.getCustomers({ limit: 100 }).then((r) => {
        setCustomers(r.data?.customers || []);
      });
      reset({
        customerId: prefillCustomerId || '',
        date: today(),
        description: '',
        amount: '',
        dueDate: '',
        notes: '',
      });
    }
  }, [isOpen, prefillCustomerId, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        customerId: data.customerId,
        date: data.date,
        description: data.description,
        amount: parseFloat(data.amount),
        dueDate: data.dueDate || null,
        notes: data.notes || null,
      };

      await customerApi.createCredit(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record credit entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Customer Credit">
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
          {errors.customerId && <p className="text-xs text-red-450 mt-1">{errors.customerId.message}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Description / Bill Reference *</label>
          <input
            type="text"
            {...register('description')}
            className={`input ${errors.description ? 'input-error' : ''}`}
            placeholder="e.g. Bill #1042 / Medicines"
          />
          {errors.description && <p className="text-xs text-red-450 mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="input-group">
            <label className="input-label">Credit Date *</label>
            <input
              type="date"
              {...register('date')}
              className={`input ${errors.date ? 'input-error' : ''}`}
            />
            {errors.date && <p className="text-xs text-red-455 mt-1">{errors.date.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Credit Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-red-455 mt-1">{errors.amount.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Due Date (Optional)</label>
            <input
              type="date"
              {...register('dueDate')}
              className={`input ${errors.dueDate ? 'input-error' : ''}`}
            />
            {errors.dueDate && <p className="text-xs text-red-455 mt-1">{errors.dueDate.message}</p>}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Notes</label>
          <textarea
            rows="2"
            {...register('notes')}
            className={`input ${errors.notes ? 'input-error' : ''}`}
            style={{ height: 'auto', padding: '10px 12px' }}
            placeholder="Optional additional notes..."
          />
          {errors.notes && <p className="text-xs text-red-455 mt-1">{errors.notes.message}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary font-semibold">
            {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
            Record Credit
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default CustomerCreditForm;
