// src/pages/borrowed/BorrowedMoneyFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  formFooterStyle,
} from '../../components/common/FormField';

export function BorrowedMoneyFormModal({ isOpen, onClose, onSubmit, initialData, loading }) {
  const [formData, setFormData] = useState({
    personName: '',
    phone: '',
    borrowedAmount: '',
    targetAmount: '',
    borrowDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    paymentMode: 'CASH',
    notes: '',
  });

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
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'borrowedAmount' && (!prev.targetAmount || prev.targetAmount === prev.borrowedAmount)) {
        next.targetAmount = value;
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Borrowed Money Record' : 'Record Borrowed Money'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
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
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
        </div>

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
            {loading ? 'Saving...' : initialData ? 'Update Record' : 'Record Borrowed Money'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
