import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { bankApi } from '../../api/bank.api';
import { formatCurrency } from '../../lib/utils';

const schema = z.object({
  accountId: z.string().min(1, 'Source account is required'),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: 'Amount must be positive',
  }),
  description: z.string().min(1, 'Description is required').max(200),
  referenceNo: z.string().max(100).optional().nullable().or(z.literal('')),
  transferToId: z.string().optional().nullable().or(z.literal('')),
});

const today = () => new Date().toISOString().split('T')[0];

export function BankTransactionForm({ isOpen, onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
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
      accountId: '',
      type: 'DEPOSIT',
      date: today(),
      amount: '',
      description: '',
      referenceNo: '',
      transferToId: '',
    },
  });

  const txnType = watch('type');
  const selectedAccountId = watch('accountId');

  useEffect(() => {
    if (isOpen) {
      bankApi.getAccounts({ limit: 50 }).then((r) => {
        setAccounts(r.data?.accounts || []);
      });
      reset({
        accountId: '',
        type: 'DEPOSIT',
        date: today(),
        amount: '',
        description: '',
        referenceNo: '',
        transferToId: '',
      });
      setError(null);
    }
  }, [isOpen, reset]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const onSubmit = async (data) => {
    if (data.type === 'TRANSFER' && !data.transferToId) {
      setError('Please select a destination account for transfer.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        accountId: data.accountId,
        type: data.type,
        date: data.date,
        amount: parseFloat(data.amount),
        description: data.description,
        referenceNo: data.referenceNo || null,
        transferToId: data.type === 'TRANSFER' ? data.transferToId : null,
      };
      await bankApi.createTransaction(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Bank Transaction">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-slate-300">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}

        <div className="input-group">
          <label className="input-label">Transaction Type *</label>
          <select
            {...register('type')}
            className={`input ${errors.type ? 'input-error' : ''}`}
          >
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="TRANSFER">Inter-Bank Transfer</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">
            {txnType === 'TRANSFER' ? 'Source Account *' : 'Bank Account *'}
          </label>
          <select
            {...register('accountId')}
            className={`input ${errors.accountId ? 'input-error' : ''}`}
          >
            <option value="">— Select Account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bankName} — {a.accountName} (Bal: ₹{Number(a.currentBalance).toLocaleString('en-IN')})
              </option>
            ))}
          </select>
          {errors.accountId && <p className="text-xs text-red-450 mt-1">{errors.accountId.message}</p>}
          {selectedAccount && (
            <p className="text-[11px] text-slate-400 mt-1">
              Current Balance: {formatCurrency(selectedAccount.currentBalance)}
            </p>
          )}
        </div>

        {txnType === 'TRANSFER' && (
          <div className="input-group">
            <label className="input-label">Destination Account *</label>
            <select
              {...register('transferToId')}
              className={`input ${errors.transferToId ? 'input-error' : ''}`}
            >
              <option value="">— Select Destination —</option>
              {accounts
                .filter((a) => a.id !== selectedAccountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} — {a.accountName} (Bal: ₹{Number(a.currentBalance).toLocaleString('en-IN')})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Date *</label>
            <input
              type="date"
              {...register('date')}
              className={`input ${errors.date ? 'input-error' : ''}`}
            />
            {errors.date && <p className="text-xs text-red-455 mt-1">{errors.date.message}</p>}
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
            {errors.amount && <p className="text-xs text-red-455 mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Description *</label>
          <input
            type="text"
            {...register('description')}
            className={`input ${errors.description ? 'input-error' : ''}`}
            placeholder="e.g. Cash deposit from daily sales"
          />
          {errors.description && <p className="text-xs text-red-455 mt-1">{errors.description.message}</p>}
        </div>

        <div className="input-group">
          <label className="input-label">Reference / Transaction ID</label>
          <input
            type="text"
            {...register('referenceNo')}
            className="input"
            placeholder="Cheque No, UTR, etc."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary font-semibold">
            {loading && <RefreshCw className="animate-spin h-4 w-4 mr-2" />}
            Record Transaction
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default BankTransactionForm;
