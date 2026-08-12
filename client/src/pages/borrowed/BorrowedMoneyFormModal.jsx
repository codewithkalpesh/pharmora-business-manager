import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  formFooterStyle,
} from '../../components/common/FormField';
import { bankApi } from '../../api/bank.api';
import { formatCurrency } from '../../lib/utils';
import { Clock } from 'lucide-react';

export function BorrowedMoneyFormModal({ isOpen, onClose, onSubmit, initialData, prefillBorrower, existingBorrowers = [], loading }) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    personName: '',
    phone: '',
    borrowedAmount: '',
    targetAmount: '',
    borrowDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    paymentMode: 'CASH',
    notes: '',
    cashAmount: '',
    upiAmount: '',
    bankAccountId: '',
  });

  const matchedBorrower = existingBorrowers.find(
    (b) => (b.personName || '').trim().toLowerCase() === (formData.personName || '').trim().toLowerCase()
  );
  const previousRemaining = matchedBorrower ? Number(matchedBorrower.totalRemaining || 0) : 0;

  useEffect(() => {
    if (initialData) {
      setFormData({
        personName: initialData.personName || '',
        phone: initialData.phone || '',
        borrowedAmount: initialData.borrowedAmount || '',
        targetAmount: initialData.targetAmount || '',
        borrowDate: initialData.borrowDate
          ? new Date(initialData.borrowDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        targetDate: initialData.targetDate
          ? new Date(initialData.targetDate).toISOString().split('T')[0]
          : '',
        paymentMode: initialData.paymentMode || 'CASH',
        notes: initialData.notes || '',
        cashAmount: initialData.cashAmount || '',
        upiAmount: initialData.upiAmount || '',
        bankAccountId: initialData.bankAccountId || '',
      });
    } else if (prefillBorrower) {
      const found = existingBorrowers.find(
        (b) => (b.personName || '').trim().toLowerCase() === (prefillBorrower.personName || '').trim().toLowerCase()
      );
      const prevDue = found ? Number(found.totalRemaining || 0) : 0;
      setFormData({
        personName: prefillBorrower.personName || '',
        phone: prefillBorrower.phone || '',
        borrowedAmount: '',
        targetAmount: prevDue > 0 ? prevDue.toFixed(2) : '',
        borrowDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        paymentMode: 'CASH',
        notes: '',
        cashAmount: '',
        upiAmount: '',
        bankAccountId: '',
      });
    } else {
      setFormData({
        personName: '',
        phone: '',
        borrowedAmount: '',
        targetAmount: '',
        borrowDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        paymentMode: 'CASH',
        notes: '',
        cashAmount: '',
        upiAmount: '',
        bankAccountId: '',
      });
    }
    setError('');
  }, [initialData, prefillBorrower, isOpen]);

  useEffect(() => {
    bankApi.getAccounts().then((r) => {
      setBankAccounts(r.data?.accounts || []);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'borrowedAmount') {
        const valNum = parseFloat(value || 0);
        const currentName = (next.personName || '').trim().toLowerCase();
        const found = existingBorrowers.find(
          (b) => (b.personName || '').trim().toLowerCase() === currentName
        );
        const prevDue = found ? Number(found.totalRemaining || 0) : 0;

        if (prevDue > 0) {
          next.targetAmount = valNum > 0 ? (valNum + prevDue).toFixed(2) : prevDue.toFixed(2);
        } else if (!prev.targetAmount || prev.targetAmount === prev.borrowedAmount) {
          next.targetAmount = value;
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const totalAmount = parseFloat(formData.borrowedAmount || 0);
    if (formData.paymentMode === 'BOTH') {
      const cash = parseFloat(formData.cashAmount || 0);
      const upi = parseFloat(formData.upiAmount || 0);
      if (Math.abs(cash + upi - totalAmount) > 0.01) {
        setError('Cash and UPI amounts must sum up to the total borrowed amount.');
        return;
      }
      if (upi > 0 && !formData.bankAccountId) {
        setError('Bank account is required for the UPI portion.');
        return;
      }
    } else if (formData.paymentMode !== 'CASH' && formData.paymentMode !== 'OTHER') {
      if (!formData.bankAccountId) {
        setError('Bank account is required for bank transactions.');
        return;
      }
    }

    const payload = {
      ...formData,
      borrowedAmount: totalAmount,
      targetAmount: parseFloat(formData.targetAmount || totalAmount),
      cashAmount: formData.paymentMode === 'BOTH' ? parseFloat(formData.cashAmount) : null,
      upiAmount: formData.paymentMode === 'BOTH' ? parseFloat(formData.upiAmount) : null,
      bankAccountId: (formData.paymentMode !== 'CASH' && formData.paymentMode !== 'OTHER' && formData.paymentMode !== 'BOTH' || (formData.paymentMode === 'BOTH' && parseFloat(formData.upiAmount || 0) > 0)) ? formData.bankAccountId : null,
    };
    onSubmit(payload);
  };

  const modalTitle = initialData
    ? 'Edit Borrowed Money Record'
    : prefillBorrower?.personName
    ? `Borrow Again from ${prefillBorrower.personName}`
    : 'Record Borrowed Money';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1.5px solid rgba(239,68,68,0.2)',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {/* Quick select existing borrower */}
        {existingBorrowers && existingBorrowers.length > 0 && !initialData && (
          <div style={{
            marginBottom: 14,
            padding: '10px 12px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1.5px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0891b2' }}>
              Select Existing Borrower / Lender:
            </span>
            <select
              onChange={(e) => {
                const selectedName = e.target.value;
                if (!selectedName) return;
                const found = existingBorrowers.find(b => b.personName === selectedName);
                if (found) {
                  const prevDue = Number(found.totalRemaining || 0);
                  const currentBorrowed = parseFloat(formData.borrowedAmount || 0);
                  setFormData(prev => ({
                    ...prev,
                    personName: found.personName,
                    phone: found.phone || prev.phone,
                    targetAmount: currentBorrowed > 0
                      ? (currentBorrowed + prevDue).toFixed(2)
                      : (prevDue > 0 ? prevDue.toFixed(2) : prev.targetAmount),
                  }));
                }
              }}
              value={existingBorrowers.some(b => b.personName === formData.personName) ? formData.personName : ''}
              style={{
                ...selectBase,
                padding: '4px 8px',
                fontSize: '0.75rem',
                height: '32px',
                width: 'auto',
                minWidth: '180px',
                borderColor: 'rgba(6, 182, 212, 0.4)',
                background: '#ffffff',
                fontWeight: 600,
              }}
            >
              <option value="">-- Choose Borrower --</option>
              {existingBorrowers.map((b, idx) => (
                <option key={idx} value={b.personName}>
                  {b.personName} {b.phone ? `(${b.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Previous Outstanding Loan Balance Alert */}
        {previousRemaining > 0 && !initialData && (
          <div style={{
            marginBottom: 14,
            padding: '12px 14px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1.5px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> Previous Outstanding Balance for {matchedBorrower?.personName}:
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#dc2626' }}>
                {formatCurrency(previousRemaining)}
              </span>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#475569',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(245, 158, 11, 0.2)',
              gap: 8,
            }}>
              <span>
                Combined Payback = <strong>{formatCurrency(previousRemaining)}</strong> (Prev.) + <strong>{formatCurrency(parseFloat(formData.borrowedAmount || 0))}</strong> (New) = <strong style={{ color: '#059669' }}>{formatCurrency(previousRemaining + parseFloat(formData.borrowedAmount || 0))}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const newAmt = parseFloat(formData.borrowedAmount || 0);
                  setFormData(prev => ({
                    ...prev,
                    targetAmount: (newAmt + previousRemaining).toFixed(2),
                  }));
                }}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Auto-Set Payback
              </button>
            </div>
          </div>
        )}

        {/* Person Name */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Lender / Person Name *">
            <input
              type="text"
              name="personName"
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.personName}
              onChange={handleChange}
              style={inputBase}
            />
          </FormField>
        </div>

        {/* Row 1: Phone + Payment Mode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FormField label="Phone Number (Optional)">
            <input
              type="tel"
              name="phone"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
              style={inputBase}
            />
          </FormField>
          <FormField label="Payment Mode">
            <select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              style={selectBase}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
              <option value="BOTH">Both (Cash & UPI)</option>
            </select>
          </FormField>
        </div>

        {formData.paymentMode === 'BOTH' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <FormField label="Cash Amount (₹) *">
              <input
                type="number"
                name="cashAmount"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.cashAmount}
                onChange={handleChange}
                style={inputBase}
              />
            </FormField>
            <FormField label="UPI Amount (₹) *">
              <input
                type="number"
                name="upiAmount"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.upiAmount}
                onChange={handleChange}
                style={inputBase}
              />
            </FormField>
          </div>
        )}

        {(formData.paymentMode !== 'CASH' && formData.paymentMode !== 'OTHER' && formData.paymentMode !== 'BOTH' || (formData.paymentMode === 'BOTH' && parseFloat(formData.upiAmount || 0) > 0)) && (
          <div style={{ marginBottom: 12 }}>
            <FormField label="Select Bank Account *">
              <select
                name="bankAccountId"
                value={formData.bankAccountId}
                onChange={handleChange}
                required
                style={selectBase}
              >
                <option value="">Select Account</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} ({a.accountName}) — ₹{Number(a.currentBalance).toFixed(2)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        {/* Row 2: Borrowed Amount + Target Payback Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FormField label="Borrowed Amount (₹) *">
            <input
              type="number"
              name="borrowedAmount"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={formData.borrowedAmount}
              onChange={handleChange}
              style={{ ...inputBase, fontWeight: 700 }}
            />
          </FormField>
          <FormField label="Target Payback Amount (₹) *">
            <input
              type="number"
              name="targetAmount"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={formData.targetAmount}
              onChange={handleChange}
              style={{ ...inputBase, fontWeight: 700, color: '#059669' }}
            />
            {previousRemaining > 0 && !initialData && (
              <span style={{ fontSize: '0.6875rem', color: '#d97706', fontWeight: 600, marginTop: 4, display: 'block' }}>
                Includes prev. due ({formatCurrency(previousRemaining)}) + new loan ({formatCurrency(parseFloat(formData.borrowedAmount || 0))})
              </span>
            )}
          </FormField>
        </div>

        {/* Row 3: Borrow Date + Target Date (Reminder) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FormField label="Borrow Date *">
            <input
              type="date"
              name="borrowDate"
              required
              value={formData.borrowDate}
              onChange={handleChange}
              style={inputBase}
            />
          </FormField>
          <FormField label="Target Date (Payment Reminder)">
            <input
              type="date"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              style={inputBase}
            />
          </FormField>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Notes">
            <textarea
              name="notes"
              rows={2}
              placeholder="Additional details or repayment notes..."
              value={formData.notes}
              onChange={handleChange}
              style={{
                ...inputBase,
                height: 'auto',
                padding: '8px 10px',
              }}
            />
          </FormField>
        </div>

        {/* Footer actions */}
        <div style={formFooterStyle}>
          <button
            type="button"
            onClick={onClose}
            style={cancelBtnStyle}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={submitBtnStyle}
          >
            {loading ? 'Saving...' : initialData ? 'Update Record' : prefillBorrower ? 'Record New Loan' : 'Record Borrowed Money'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
