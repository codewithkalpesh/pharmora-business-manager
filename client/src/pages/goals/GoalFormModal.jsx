import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShoppingCart, Receipt, HandCoins, Target, Calendar, DollarSign, Building } from 'lucide-react';
import addDays from 'date-fns/addDays';
import Modal from '../../components/common/Modal';
import { goalApi } from '../../api/goal.api';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  sectionLabelStyle, errorBannerStyle, formFooterStyle, useInputStyle,
} from '../../components/common/FormField';

const goalSchema = z.object({
  category: z.enum(['PURCHASE', 'EXPENSE', 'BORROWED_MONEY', 'GENERAL']),
  title: z.string().optional(),
  description: z.string().optional(),
  targetAmount: z.coerce.number().min(1, 'Target amount must be greater than zero'),
  targetDate: z.string().nonempty('Target date is required'),
  distributorId: z.string().optional().nullable(),
  billId: z.string().optional().nullable(),
  expenseCategoryId: z.string().optional().nullable(),
  borrowedMoneyId: z.string().optional().nullable(),
});

export default function GoalFormModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fetchingSync, setFetchingSync] = useState(false);
  const [syncData, setSyncData] = useState({ distributors: [], expenseCategories: [], borrowedList: [] });
  const [error, setError] = useState('');
  const [targetDays, setTargetDays] = useState('7');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      category: 'PURCHASE',
      title: '',
      description: '',
      targetAmount: '',
      targetDate: new Date().toISOString().split('T')[0],
      distributorId: '',
      billId: '',
      expenseCategoryId: '',
      borrowedMoneyId: '',
    },
  });

  const category = watch('category');
  const selectedDistributorId = watch('distributorId');
  const selectedBillId = watch('billId');
  const selectedBorrowedId = watch('borrowedMoneyId');

  useEffect(() => {
    if (isOpen) {
      setFetchingSync(true);
      setError('');
      goalApi
        .getSyncData()
        .then((res) => {
          setSyncData(res.data.data || { distributors: [], expenseCategories: [], borrowedList: [] });
        })
        .catch((err) => {
          console.error('Failed to fetch goal sync data:', err);
        })
        .finally(() => setFetchingSync(false));

      reset({
        category: 'PURCHASE',
        title: '',
        description: '',
        targetAmount: '',
        targetDate: new Date().toISOString().split('T')[0],
        distributorId: '',
        billId: '',
        expenseCategoryId: '',
        borrowedMoneyId: '',
      });
      setTargetDays('7');
    }
  }, [isOpen, reset]);

  // Handle Purchase Category Distributor change
  const selectedDistributor = syncData.distributors.find((d) => d.id === selectedDistributorId);
  const selectedBill = selectedDistributor?.pendingBills?.find((b) => b.id === selectedBillId);

  useEffect(() => {
    if (category === 'PURCHASE' && selectedDistributor) {
      if (selectedBill) {
        setValue('targetAmount', selectedBill.balanceDue || '');
        if (selectedBill.dueDate) {
          setValue('targetDate', new Date(selectedBill.dueDate).toISOString().split('T')[0]);
        }
      } else if (selectedDistributor.pendingDues > 0) {
        setValue('targetAmount', selectedDistributor.pendingDues);
      }
    }
  }, [category, selectedDistributorId, selectedBillId, selectedDistributor, selectedBill, setValue]);

  // Handle Borrowed Money Selection
  const selectedBorrowed = syncData.borrowedList.find((b) => b.id === selectedBorrowedId);
  useEffect(() => {
    if (category === 'BORROWED_MONEY' && selectedBorrowed) {
      setValue('targetAmount', selectedBorrowed.balanceOwed || '');
      if (selectedBorrowed.targetDate) {
        setValue('targetDate', new Date(selectedBorrowed.targetDate).toISOString().split('T')[0]);
      }
    }
  }, [category, selectedBorrowedId, selectedBorrowed, setValue]);

  // Handle Expense Target Days calculation
  const handleDaysChange = (days) => {
    setTargetDays(days);
    if (days && !isNaN(parseInt(days, 10))) {
      const futureDate = addDays(new Date(), parseInt(days, 10));
      setValue('targetDate', futureDate.toISOString().split('T')[0]);
    }
  };

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    try {
      await goalApi.createGoal(values);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal.');
    } finally {
      setLoading(false);
    }
  };

  const inp = useInputStyle(errors);

  const categories = [
    { id: 'PURCHASE', label: 'Purchases', icon: ShoppingCart, desc: 'Distributors & Bills' },
    { id: 'EXPENSE', label: 'Expense', icon: Receipt, desc: 'Recurring or One-off' },
    { id: 'BORROWED_MONEY', label: 'Borrowed Money', icon: HandCoins, desc: 'Payee Repayments' },
    { id: 'GENERAL', label: 'General', icon: Target, desc: 'Custom Goal' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Payment / Savings Goal">
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* Category Tabs */}
        <p style={sectionLabelStyle('#3b82f6')}>Select Goal Category *</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setValue('category', cat.id);
                  setValue('targetAmount', '');
                  setValue('title', '');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: isSelected ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary)',
                  color: isSelected ? '#10b981' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    background: isSelected ? '#10b981' : 'rgba(148,163,184,0.1)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? '#0f172a' : 'var(--text-primary)' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{cat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {fetchingSync && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#64748b', fontSize: '0.8125rem' }}>
            <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />
            Syncing pending dues & accounts...
          </div>
        )}

        {/* 🛒 PURCHASES FLOW */}
        {category === 'PURCHASE' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormField label="Distributor / Supplier *" error={errors.distributorId?.message}>
                <select
                  {...register('distributorId')}
                  style={{ ...selectBase, ...(errors.distributorId ? { borderColor: '#ef4444' } : {}) }}
                >
                  <option value="">Select Distributor</option>
                  {syncData.distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Pending: ₹{d.pendingDues.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Specific Bill (Optional)" error={errors.billId?.message}>
                <select
                  {...register('billId')}
                  disabled={!selectedDistributor}
                  style={{ ...selectBase, opacity: !selectedDistributor ? 0.6 : 1 }}
                >
                  <option value="">All Pending Bills / Dues</option>
                  {selectedDistributor?.pendingBills?.map((b) => (
                    <option key={b.id} value={b.id}>
                      Inv #{b.invoiceNo} — ₹{b.balanceDue.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {selectedDistributor && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  marginBottom: 12,
                  fontSize: '0.75rem',
                  color: '#2563eb',
                }}
              >
                <strong>{selectedDistributor.name}</strong> has{' '}
                <strong>{selectedDistributor.pendingBills.length} pending bill(s)</strong> with total outstanding dues of{' '}
                <strong>₹{selectedDistributor.pendingDues.toLocaleString('en-IN')}</strong>.
              </div>
            )}
          </>
        )}

        {/* 💸 EXPENSE FLOW */}
        {category === 'EXPENSE' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormField label="Expense Type / Category *" error={errors.expenseCategoryId?.message}>
                <select
                  {...register('expenseCategoryId')}
                  style={{ ...selectBase, ...(errors.expenseCategoryId ? { borderColor: '#ef4444' } : {}) }}
                >
                  <option value="">Select Category</option>
                  {syncData.expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Target Days (Shortcut)" error={null}>
                <select
                  value={targetDays}
                  onChange={(e) => handleDaysChange(e.target.value)}
                  style={selectBase}
                >
                  <option value="3">In 3 Days</option>
                  <option value="7">In 1 Week (7 Days)</option>
                  <option value="15">In 15 Days</option>
                  <option value="30">In 1 Month (30 Days)</option>
                  <option value="custom">Custom Date below</option>
                </select>
              </FormField>
            </div>
          </>
        )}

        {/* 🤝 BORROWED MONEY FLOW */}
        {category === 'BORROWED_MONEY' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <FormField label="Select Lender / Payee *" error={errors.borrowedMoneyId?.message}>
                <select
                  {...register('borrowedMoneyId')}
                  style={{ ...selectBase, ...(errors.borrowedMoneyId ? { borderColor: '#ef4444' } : {}) }}
                >
                  <option value="">Select Payee</option>
                  {syncData.borrowedList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.personName} — Balance Owed: ₹{b.balanceOwed.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {selectedBorrowed && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  marginBottom: 12,
                  fontSize: '0.75rem',
                  color: '#ca8a04',
                }}
              >
                Money owed to <strong>{selectedBorrowed.personName}</strong>: Total borrowed ₹
                {selectedBorrowed.targetAmount.toLocaleString('en-IN')}, Remaining balance: ₹
                {selectedBorrowed.balanceOwed.toLocaleString('en-IN')}.
              </div>
            )}
          </>
        )}

        {/* Common Target Amount & Payment Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FormField label="Target Goal Amount (₹) *" error={errors.targetAmount?.message}>
            <input type="number" step="0.01" placeholder="0.00" {...register('targetAmount')} {...inp()} />
          </FormField>

          <FormField label="Date of Payment / Goal Deadline *" error={errors.targetDate?.message}>
            <input type="date" {...register('targetDate')} {...inp()} />
          </FormField>
        </div>

        {/* Custom Title & Description */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Goal Title / Name (Optional)" error={errors.title?.message}>
            <input
              type="text"
              placeholder="e.g. Weekly Payment to ColdDrink Supplier"
              {...register('title')}
              {...inp()}
            />
          </FormField>
        </div>

        <FormField label="Notes / Description" error={null}>
          <textarea
            rows="2"
            placeholder="Remarks or target payment notes..."
            {...register('description')}
            style={{ ...inputBase, height: 'auto', padding: '8px 10px', resize: 'none' }}
          />
        </FormField>

        <div style={formFooterStyle}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create Goal Target
          </button>
        </div>
      </form>
    </Modal>
  );
}
