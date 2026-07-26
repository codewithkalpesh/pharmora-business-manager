import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw, Check, MessageCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { customerApi } from '../../api/customer.api';
import { bankApi } from '../../api/bank.api';

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerCreditId: z.string().optional().nullable().or(z.literal('')),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  paymentMode: z.enum(['CASH', 'UPI', 'BOTH', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  referenceNo: z.string().max(100).optional().nullable().or(z.literal('')),
  notes: z.string().max(500).optional().nullable().or(z.literal('')),
  cashAmount: z.string().optional().nullable().or(z.literal('')),
  upiAmount: z.string().optional().nullable().or(z.literal('')),
  bankAccountId: z.string().optional().nullable().or(z.literal('')),
}).refine(
  (data) => {
    const total = parseFloat(data.amount);
    if (data.paymentMode === 'BOTH') {
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
).refine(
  (data) => {
    if (data.paymentMode !== 'CASH' && data.paymentMode !== 'OTHER' && data.paymentMode !== 'BOTH' && !data.bankAccountId) return false;
    if (data.paymentMode === 'BOTH' && parseFloat(data.upiAmount || 0) > 0 && !data.bankAccountId) return false;
    return true;
  },
  {
    message: 'Bank account is required for bank payments',
    path: ['bankAccountId'],
  }
);

const today = () => new Date().toISOString().split('T')[0];

export function CreditCollectionForm({ isOpen, onClose, onSuccess, prefillCustomerId = null, prefillCreditId = null }) {
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

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
      cashAmount: '',
      upiAmount: '',
      bankAccountId: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedCreditId = watch('customerCreditId');
  const paymentMode = watch('paymentMode');
  const upiAmount = watch('upiAmount');

  useEffect(() => {
    bankApi.getAccounts().then((r) => {
      setBankAccounts(r.data?.accounts || []);
    });
  }, []);

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
        cashAmount: '',
        upiAmount: '',
        bankAccountId: '',
      });
      setSuccessData(null);
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

  const handleSendWhatsApp = () => {
    if (!successData || !successData.customer?.phone) return;

    const phone = successData.customer.phone;
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? '91' : '';
    const targetPhone = formattedPhone + cleanPhone;

    const amount = Number(successData.amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const dateStr = new Date(successData.collectionDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const refNoStr = successData.referenceNo ? `\n🔍 *Reference No:* ${successData.referenceNo}` : '';

    const message = `*Pharmora Business Manager*\n------------------------------\nDear *${successData.customer.name}*,\n\nWe have successfully received your payment.\n💰 *Amount Paid:* ₹${amount}\n📅 *Date:* ${dateStr}\n💳 *Payment Mode:* ${successData.paymentMode}${refNoStr}\n\nThank you!`;

    const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    onSuccess();
    onClose();
  };

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
        cashAmount: data.paymentMode === 'BOTH' ? parseFloat(data.cashAmount) : null,
        upiAmount: data.paymentMode === 'BOTH' ? parseFloat(data.upiAmount) : null,
        bankAccountId: (data.paymentMode !== 'CASH' && data.paymentMode !== 'OTHER' && data.paymentMode !== 'BOTH' || (data.paymentMode === 'BOTH' && parseFloat(data.upiAmount || 0) > 0)) ? data.bankAccountId : null,
      };

      const res = await customerApi.createCollection(payload);
      const createdData = res.data?.data;

      if (createdData && createdData.customer?.phone) {
        setSuccessData(createdData);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record collection receipt.');
    } finally {
      setLoading(false);
    }
  };

  const currentCredit = credits.find((c) => c.id === selectedCreditId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment Collection">
      {successData ? (
        <div className="text-center py-6 space-y-4 text-slate-350">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Payment Collection Recorded!</h3>
            <p className="text-xs text-slate-400 mt-1">
              A receipt of ₹{Number(successData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} was recorded for {successData.customer?.name}.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 my-2 text-left space-y-1.5">
            <p className="text-xs font-semibold text-slate-300">WhatsApp Receipt Details:</p>
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Recipient:</span> {successData.customer.name}
            </p>
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Phone:</span> {successData.customer.phone}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="btn btn-primary font-semibold flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4" /> Send WhatsApp Receipt
            </button>
            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="btn btn-secondary font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
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
                <option value="BOTH">Both (Cash & UPI)</option>
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

          {paymentMode === 'BOTH' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

          {(paymentMode !== 'CASH' && paymentMode !== 'OTHER' && paymentMode !== 'BOTH' || (paymentMode === 'BOTH' && parseFloat(upiAmount || 0) > 0)) && (
            <div className="input-group mt-4">
              <label className="input-label">Select Bank Account *</label>
              <select
                {...register('bankAccountId')}
                className={`input ${errors.bankAccountId ? 'input-error' : ''}`}
              >
                <option value="">Select Account</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} ({a.accountName}) — ₹{Number(a.currentBalance).toFixed(2)}
                  </option>
                ))}
              </select>
              {errors.bankAccountId && <p className="text-xs text-red-455 mt-1">{errors.bankAccountId.message}</p>}
            </div>
          )}

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
      )}
    </Modal>
  );
}
export default CreditCollectionForm;
