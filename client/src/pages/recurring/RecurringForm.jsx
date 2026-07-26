import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { recurringApi } from '../../api/recurring.api';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(200).optional().nullable().or(z.literal('')),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: 'Amount must be positive',
  }),
  type: z.enum(['INCOME', 'EXPENSE']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM']),
  action: z.enum(['REMINDER_ONLY', 'AUTO_DRAFT']),
  paymentMode: z.enum(['CASH', 'UPI', 'BOTH']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional().nullable().or(z.literal('')),
  customDays: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
  cashAmount: z.string().optional().nullable().or(z.literal('')),
  upiAmount: z.string().optional().nullable().or(z.literal('')),
}).refine(
  (data) => {
    if (data.frequency === 'CUSTOM') {
      const days = parseInt(data.customDays || '', 10);
      return !isNaN(days) && days > 0;
    }
    return true;
  },
  {
    message: 'Custom days is required and must be positive when frequency is CUSTOM',
    path: ['customDays'],
  }
).refine(
  (data) => {
    if (data.paymentMode === 'BOTH') {
      const total = parseFloat(data.amount);
      const cash = parseFloat(data.cashAmount || 0);
      const upi = parseFloat(data.upiAmount || 0);
      if (Math.abs(cash + upi - total) > 0.01) return false;
    }
    return true;
  },
  {
    message: 'Cash and UPI amounts must sum up to the total amount',
    path: ['cashAmount'],
  }
);

const today = () => new Date().toISOString().split('T')[0];

export function RecurringForm({ isOpen, onClose, onSuccess, schedule = null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      amount: '',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      action: 'REMINDER_ONLY',
      paymentMode: 'CASH',
      startDate: today(),
      endDate: '',
      customDays: '',
      isActive: true,
      cashAmount: '',
      upiAmount: '',
    },
  });

  const selectedFrequency = watch('frequency');
  const paymentMode = watch('paymentMode');

  useEffect(() => {
    if (schedule) {
      let cashVal = '';
      let upiVal = '';
      let cleanDesc = schedule.description || '';
      if (schedule.paymentMode === 'BOTH' && schedule.description) {
        const match = schedule.description.match(/\[BOTH:cash=([\d.]+),upi=([\d.]+)\]/);
        if (match) {
          cashVal = match[1];
          upiVal = match[2];
          cleanDesc = schedule.description.replace(/\[BOTH:cash=[\d.]+,upi=[\d.]+\]\s*/, '');
        }
      }
      reset({
        title: schedule.title || '',
        description: cleanDesc,
        amount: String(schedule.amount || ''),
        type: schedule.type || 'EXPENSE',
        frequency: schedule.frequency || 'MONTHLY',
        action: schedule.action || 'REMINDER_ONLY',
        paymentMode: schedule.paymentMode || 'CASH',
        startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : today(),
        endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : '',
        customDays: schedule.customDays ? String(schedule.customDays) : '',
        isActive: schedule.isActive !== undefined ? schedule.isActive : true,
        cashAmount: cashVal,
        upiAmount: upiVal,
      });
    } else {
      reset({
        title: '',
        description: '',
        amount: '',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        action: 'REMINDER_ONLY',
        paymentMode: 'CASH',
        startDate: today(),
        endDate: '',
        customDays: '',
        isActive: true,
        cashAmount: '',
        upiAmount: '',
      });
    }
    setError(null);
  }, [schedule, reset, isOpen]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      let desc = data.description || '';
      if (data.paymentMode === 'BOTH') {
        desc = `[BOTH:cash=${data.cashAmount},upi=${data.upiAmount}] ${desc}`.trim();
      }
      const payload = {
        title: data.title,
        description: desc || null,
        amount: parseFloat(data.amount),
        type: data.type,
        frequency: data.frequency,
        action: data.action,
        paymentMode: data.paymentMode,
        startDate: data.startDate,
        endDate: data.endDate || null,
        customDays: data.frequency === 'CUSTOM' ? parseInt(data.customDays, 10) : null,
        isActive: data.isActive,
      };

      if (schedule) {
        await recurringApi.updateRecurring(schedule.id, payload);
      } else {
        await recurringApi.createRecurring(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save recurring schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={schedule ? 'Edit Recurring Schedule' : 'Add Recurring Schedule'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input
              type="text"
              {...register('title')}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Shop Electricity Bill"
            />
            {errors.title && <p className="text-xs text-red-450 mt-1">{errors.title.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className={`input ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-red-450 mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="input-group">
            <label className="input-label">Transaction Type *</label>
            <select {...register('type')} className="input">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Payment Mode *</label>
            <select {...register('paymentMode')} className="input">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BOTH">Both (Cash & UPI)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Execution Action *</label>
            <select {...register('action')} className="input">
              <option value="REMINDER_ONLY">Reminder Only</option>
              <option value="AUTO_DRAFT">Auto Draft (Record)</option>
            </select>
          </div>
        </div>

        {paymentMode === 'BOTH' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Cash Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                {...register('cashAmount')}
                className={`input ${errors.cashAmount ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.cashAmount && <p className="text-xs text-red-455 mt-1">{errors.cashAmount.message}</p>}
            </div>

            <div className="input-group">
              <label className="input-label">UPI Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                {...register('upiAmount')}
                className={`input ${errors.upiAmount ? 'input-error' : ''}`}
                placeholder="0.00"
              />
              {errors.upiAmount && <p className="text-xs text-red-455 mt-1">{errors.upiAmount.message}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Frequency *</label>
            <select {...register('frequency')} className="input">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half Yearly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom Days</option>
            </select>
          </div>

          {selectedFrequency === 'CUSTOM' && (
            <div className="input-group">
              <label className="input-label">Repeat Every (Days) *</label>
              <input
                type="number"
                {...register('customDays')}
                className={`input ${errors.customDays ? 'input-error' : ''}`}
                placeholder="e.g. 15"
              />
              {errors.customDays && <p className="text-xs text-red-450 mt-1">{errors.customDays.message}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Start Date *</label>
            <input
              type="date"
              {...register('startDate')}
              className={`input ${errors.startDate ? 'input-error' : ''}`}
            />
            {errors.startDate && <p className="text-xs text-red-450 mt-1">{errors.startDate.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">End Date (Optional)</label>
            <input
              type="date"
              {...register('endDate')}
              className={`input ${errors.endDate ? 'input-error' : ''}`}
            />
            {errors.endDate && <p className="text-xs text-red-450 mt-1">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Description / Notes</label>
          <textarea
            {...register('description')}
            rows="2"
            className="input resize-none py-2"
            placeholder="Add schedule instructions, account numbers, utility details, etc."
          />
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0"
          />
          <label htmlFor="isActive" className="text-sm font-semibold text-slate-200 cursor-pointer">
            Active schedule
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary font-semibold">
            {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
            {schedule ? 'Save Changes' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default RecurringForm;
