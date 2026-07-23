import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { bankApi } from '../../api/bank.api';

const schema = z.object({
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountName: z.string().min(1, 'Account holder name is required').max(100),
  accountNumber: z.string().max(30).optional().nullable().or(z.literal('')),
  ifscCode: z.string().max(20).optional().nullable().or(z.literal('')),
  openingBalance: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: 'Opening balance must be zero or positive',
  }),
  isPrimary: z.boolean().optional(),
});

export function BankAccountForm({ isOpen, onClose, onSuccess, account = null }) {
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
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      openingBalance: '0',
      isPrimary: false,
    },
  });

  useEffect(() => {
    if (account) {
      reset({
        bankName: account.bankName || '',
        accountName: account.accountName || '',
        accountNumber: account.accountNumber || '',
        ifscCode: account.ifscCode || '',
        openingBalance: String(account.openingBalance || 0),
        isPrimary: account.isPrimary || false,
      });
    } else {
      reset({
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        openingBalance: '0',
        isPrimary: false,
      });
    }
  }, [account, reset, isOpen]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        openingBalance: parseFloat(data.openingBalance),
        isPrimary: !!data.isPrimary,
      };

      if (account) {
        await bankApi.updateAccount(account.id, payload);
      } else {
        await bankApi.createAccount(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save bank account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Bank Account' : 'Add Bank Account'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Bank Name *</label>
            <input
              type="text"
              {...register('bankName')}
              className={`input ${errors.bankName ? 'input-error' : ''}`}
              placeholder="e.g. HDFC Bank"
            />
            {errors.bankName && <p className="text-xs text-red-450 mt-1">{errors.bankName.message}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Account Holder *</label>
            <input
              type="text"
              {...register('accountName')}
              className={`input ${errors.accountName ? 'input-error' : ''}`}
              placeholder="e.g. Pharmora Medical Store"
            />
            {errors.accountName && <p className="text-xs text-red-450 mt-1">{errors.accountName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Account Number</label>
            <input
              type="text"
              {...register('accountNumber')}
              className="input font-mono"
              placeholder="e.g. 50100XXXXXX123"
            />
          </div>

          <div className="input-group">
            <label className="input-label">IFSC Code</label>
            <input
              type="text"
              {...register('ifscCode')}
              className="input font-mono uppercase"
              placeholder="e.g. HDFC0001234"
            />
          </div>
        </div>

        {!account && (
          <div className="input-group">
            <label className="input-label">Opening Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              {...register('openingBalance')}
              className={`input ${errors.openingBalance ? 'input-error' : ''}`}
              placeholder="0.00"
            />
            {errors.openingBalance && <p className="text-xs text-red-455 mt-1">{errors.openingBalance.message}</p>}
          </div>
        )}

        <div className="flex items-center gap-2.5 py-2.5 bg-slate-900/10 border border-slate-800/40 rounded-xl px-4 mt-2">
          <input
            type="checkbox"
            id="isPrimary"
            {...register('isPrimary')}
            className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
          />
          <label htmlFor="isPrimary" className="text-sm font-medium text-slate-350 cursor-pointer select-none">
            Make this my Primary Bank Account
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary font-semibold">
            {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
            {account ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default BankAccountForm;
