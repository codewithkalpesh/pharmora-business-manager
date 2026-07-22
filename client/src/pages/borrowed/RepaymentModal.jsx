// src/pages/borrowed/RepaymentModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  formFooterStyle,
} from '../../components/common/FormField';
import { formatCurrency } from '../../lib/utils';

export function RepaymentModal({ isOpen, onClose, onSubmit, borrowedItem, activeItems = [], loading }) {
  const [formData, setFormData] = useState({
    amount: '',
    repaymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    referenceNo: '',
    notes: '',
  });

  const [selectedId, setSelectedId] = useState('');

  const currentItem = borrowedItem || activeItems.find((i) => i.id === selectedId) || null;

  useEffect(() => {
    if (isOpen) {
      if (borrowedItem) {
        const remaining = Math.max(0, Number(borrowedItem.targetAmount) - Number(borrowedItem.paidAmount));
        setFormData({
          amount: remaining > 0 ? remaining : '',
          repaymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'CASH',
          referenceNo: '',
          notes: '',
        });
      } else if (activeItems && activeItems.length > 0) {
        const firstItem = activeItems[0];
        setSelectedId(firstItem.id);
        const remaining = Math.max(0, Number(firstItem.targetAmount) - Number(firstItem.paidAmount));
        setFormData({
          amount: remaining > 0 ? remaining : '',
          repaymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'CASH',
          referenceNo: '',
          notes: '',
        });
      } else {
        setSelectedId('');
        setFormData({
          amount: '',
          repaymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'CASH',
          referenceNo: '',
          notes: '',
        });
      }
    }
  }, [borrowedItem, activeItems, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const item = activeItems.find((i) => i.id === id);
    if (item) {
      const remaining = Math.max(0, Number(item.targetAmount) - Number(item.paidAmount));
      setFormData((prev) => ({
        ...prev,
        amount: remaining > 0 ? remaining : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        amount: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const itemId = currentItem?.id;
    if (!itemId) {
      alert('Please select a record.');
      return;
    }
    onSubmit(formData, itemId);
  };

  if (!isOpen) return null;

  if (!borrowedItem && (!activeItems || activeItems.length === 0)) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Record Repayment"
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>No pending records found</p>
          <p style={{ fontSize: '0.75rem', marginTop: 4 }}>You don't have any pending or partial borrowed money records to repay.</p>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0 18px',
              height: 36,
              borderRadius: 10,
              cursor: 'pointer',
              background: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.2)',
              color: '#334155',
              fontSize: '0.8125rem',
              fontWeight: 700,
              marginTop: 16
            }}
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const remaining = currentItem ? Math.max(0, Number(currentItem.targetAmount) - Number(currentItem.paidAmount)) : 0;
  const targetAmount = currentItem ? currentItem.targetAmount : 0;
  const title = borrowedItem ? `Record Repayment to ${borrowedItem.personName}` : 'Record Repayment';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        {/* Lender selection dropdown (Only when no specific borrowedItem is passed) */}
        {!borrowedItem && (
          <div style={{ marginBottom: 12 }}>
            <FormField label="Select Lender / Record *">
              <select
                name="selectedId"
                value={selectedId}
                onChange={handleItemChange}
                style={selectBase}
                required
              >
                {activeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.personName} (Remaining: {formatCurrency(item.remainingAmount || 0)})
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        {/* Info Banner */}
        <div
          style={{
            padding: '12px 14px',
            marginBottom: 14,
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1.5px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Target Payback
            </span>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
              {formatCurrency(targetAmount)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Remaining Due
            </span>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#d97706' }}>
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>

        {/* Repayment Amount */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Repayment Amount (₹) *">
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              style={{ ...inputBase, fontSize: '1rem', fontWeight: 800, color: '#059669' }}
            />
          </FormField>
        </div>

        {/* Row 1: Payment Date + Payment Mode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FormField label="Payment Date *">
            <input
              type="date"
              name="repaymentDate"
              required
              value={formData.repaymentDate}
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

        {/* Reference No */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Reference No / Txn ID (Optional)">
            <input
              type="text"
              name="referenceNo"
              placeholder="e.g. UPI/123456789"
              value={formData.referenceNo}
              onChange={handleChange}
              style={{ ...inputBase, fontFamily: 'monospace' }}
            />
          </FormField>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <FormField label="Notes (Optional)">
            <input
              type="text"
              name="notes"
              placeholder="e.g. Partial repayment via GPay"
              value={formData.notes}
              onChange={handleChange}
              style={inputBase}
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
            {loading ? 'Recording...' : 'Submit Repayment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
