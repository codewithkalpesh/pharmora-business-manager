// src/pages/payments/PaymentForm.jsx
// Redesigned to use the shared Modal + light-mode FormField utilities
import { useState, useEffect } from 'react';
import { purchaseApi } from '../../api/purchase.api';
import { createPayment } from '../../api/payment.api';
import { Loader2 } from 'lucide-react';
import {
  FormField, inputBase, selectBase, cancelBtnStyle, submitBtnStyle,
  errorBannerStyle, formFooterStyle, useInputStyle,
} from '../../components/common/FormField';

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER'];
const today = () => new Date().toISOString().split('T')[0];

export function PaymentForm({ onClose, onSuccess, prefillDistributorId = null, prefillBillId = null }) {
  const [distributors, setDistributors] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    distributorId: prefillDistributorId || '',
    billId: prefillBillId || '',
    paymentDate: today(),
    amount: '',
    paymentMode: 'CASH',
    referenceNo: '',
    notes: '',
  });

  useEffect(() => {
    purchaseApi.getDistributors({ limit: 200 }).then((r) => {
      const list = r.data?.data?.distributors || r.data?.distributors || [];
      setDistributors(list);
    });
  }, []);

  useEffect(() => {
    if (form.distributorId) {
      purchaseApi.getBills({ distributorId: form.distributorId, limit: 100 }).then((r) => {
        const list = r.data?.data?.bills || r.data?.bills || [];
        const pendingBills = list.filter((b) => b.status !== 'PAID');
        setBills(pendingBills);
      });
    } else {
      setBills([]);
      setForm((f) => ({ ...f, billId: '' }));
    }
  }, [form.distributorId]);

  useEffect(() => {
    if (form.billId) {
      const bill = bills.find((b) => b.id === form.billId);
      if (bill) {
        const outstanding = Number(bill.grandTotal) - Number(bill.paidAmount);
        setForm((f) => ({ ...f, amount: outstanding.toFixed(2) }));
      }
    }
  }, [form.billId, bills]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createPayment({ ...form, amount: parseFloat(form.amount), billId: form.billId || null });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDistributor = distributors.find((d) => d.id === form.distributorId);
  const selectedBill = bills.find((b) => b.id === form.billId);

  const focusOn = (e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; };
  const focusOff = (e) => { e.target.style.borderColor = 'rgba(148,163,184,0.2)'; e.target.style.boxShadow = 'none'; };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={errorBannerStyle}>{error}</div>}

      {/* Distributor */}
      <div style={{ marginBottom: 12 }}>
        <FormField label="Distributor *" error={null}>
          <select
            value={form.distributorId}
            onChange={(e) => set('distributorId', e.target.value)}
            required
            disabled={!!prefillDistributorId}
            style={{ ...selectBase, opacity: prefillDistributorId ? 0.6 : 1 }}
          >
            <option value="">— Select Distributor —</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.outstandingDues > 0 ? `(Outstanding: ₹${Number(d.outstandingDues).toLocaleString('en-IN')})` : '(No Dues)'}
              </option>
            ))}
          </select>
        </FormField>

        {/* Selected Distributor Remaining Payment Badge */}
        {selectedDistributor && (
          <div style={{
            marginTop: 8,
            padding: '10px 14px',
            borderRadius: 10,
            background: Number(selectedDistributor.outstandingDues) > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
            border: `1.5px solid ${Number(selectedDistributor.outstandingDues) > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Distributor Remaining Payment:
            </span>
            <span style={{
              fontSize: '0.9375rem',
              fontWeight: 800,
              color: Number(selectedDistributor.outstandingDues) > 0 ? '#dc2626' : '#059669',
              fontFamily: 'monospace',
            }}>
              ₹{Number(selectedDistributor.outstandingDues || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Bill selector (conditional) */}
      {form.distributorId && (
        <div style={{ marginBottom: 12 }}>
          <FormField label="Link to Invoice (optional)" error={null}>
            <select
              value={form.billId}
              onChange={(e) => set('billId', e.target.value)}
              disabled={!!prefillBillId}
              style={{ ...selectBase, opacity: prefillBillId ? 0.6 : 1 }}
            >
              <option value="">— General payment (no specific invoice) —</option>
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.invoiceNo} — Outstanding ₹{(Number(b.grandTotal) - Number(b.paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </FormField>
          {selectedBill && (
            <div style={{
              marginTop: 6, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.8125rem', color: '#475569',
            }}>
              <span>Invoice Total: <strong>₹{Number(selectedBill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
              <span>Paid: <strong>₹{Number(selectedBill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Row: Date + Amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="Payment Date *" error={null}>
          <input
            type="date" value={form.paymentDate} required
            onChange={(e) => set('paymentDate', e.target.value)}
            style={inputBase} onFocus={focusOn} onBlur={focusOff}
          />
        </FormField>
        <FormField label="Amount (₹) *" error={null}>
          <input
            type="number" min="0.01" step="0.01" placeholder="0.00"
            value={form.amount} required
            onChange={(e) => set('amount', e.target.value)}
            style={inputBase} onFocus={focusOn} onBlur={focusOff}
          />
        </FormField>
      </div>

      {/* Row: Mode + Reference */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <FormField label="Payment Mode" error={null}>
          <select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)} style={selectBase}>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Reference No." error={null}>
          <input
            type="text" placeholder="Cheque no., UTR, etc."
            value={form.referenceNo}
            onChange={(e) => set('referenceNo', e.target.value)}
            style={inputBase} onFocus={focusOn} onBlur={focusOff}
          />
        </FormField>
      </div>

      {/* Notes */}
      <FormField label="Notes" error={null}>
        <textarea
          rows="2" placeholder="Optional notes about this payment"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          style={{ ...inputBase, height: 'auto', padding: '8px 10px', resize: 'none' }}
          onFocus={focusOn} onBlur={focusOff}
        />
      </FormField>

      <div style={formFooterStyle}>
        <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : '💳'}
          {loading ? 'Saving…' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
}
