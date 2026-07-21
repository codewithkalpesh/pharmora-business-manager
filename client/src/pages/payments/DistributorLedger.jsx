// src/pages/payments/DistributorLedger.jsx
import { useState, useEffect, useCallback } from 'react';
import { getDistributorLedger, deletePayment } from '../../api/payment.api';
import { Loader2, Plus, RefreshCw, FileText, ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { PaymentForm } from './PaymentForm';
import Modal from '../../components/common/Modal';

const fmt = (n) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function DistributorLedger({ distributorId, onClose, onSync }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const fetchLedger = useCallback(() => {
    if (!distributorId) return;
    setLoading(true);
    getDistributorLedger(distributorId)
      .then((r) => {
        setData(r.data);
        setError(null);
      })
      .catch(() => setError('Failed to load transaction ledger.'))
      .finally(() => setLoading(false));
  }, [distributorId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    fetchLedger();
    onSync?.();
  };

  const handleReversePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to reverse this payment? Linked bill statuses will be recalculated.')) return;
    try {
      await deletePayment(paymentId);
      fetchLedger();
      onSync?.();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reverse payment.');
    }
  };

  return (
    <div style={{ color: '#0f172a' }}>
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#64748b', gap: 8 }}>
          <Loader2 size={20} className="animate-spin text-emerald-500" />
          <span>Loading ledger history…</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#dc2626', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Top Info Banner & Action Button */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                {data.distributor?.name}
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                {data.distributor?.gstNumber ? `GSTIN: ${data.distributor.gstNumber}` : 'No GSTIN registered'} • Phone: {data.distributor?.phone || 'N/A'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={fetchLedger}
                style={{
                  padding: '0 12px', height: 36, borderRadius: 8, cursor: 'pointer',
                  background: '#f8fafc', border: '1px solid rgba(148,163,184,0.2)',
                  color: '#475569', fontSize: '0.8125rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentForm(true)}
                style={{
                  padding: '0 16px', height: 36, borderRadius: 8, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: 'white', fontSize: '0.8125rem', fontWeight: 700,
                  boxShadow: '0 3px 10px rgba(16,185,129,0.25)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={14} />
                Record Payment
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0 14px', height: 36, borderRadius: 8, cursor: 'pointer',
                  background: '#f1f5f9', border: '1px solid rgba(148,163,184,0.25)',
                  color: '#475569', fontSize: '0.8125rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div style={{
              background: '#f8fafc', borderRadius: 12, padding: '12px 14px',
              border: '1px solid rgba(148,163,184,0.14)',
            }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                Total Invoiced (Billed)
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                ₹{fmt(data.summary.totalBilled)}
              </span>
            </div>

            <div style={{
              background: '#f8fafc', borderRadius: 12, padding: '12px 14px',
              border: '1px solid rgba(148,163,184,0.14)',
            }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                Total Paid
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                ₹{fmt(data.summary.totalPaid)}
              </span>
            </div>

            <div style={{
              background: data.summary.outstanding > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
              borderRadius: 12, padding: '12px 14px',
              border: `1px solid ${data.summary.outstanding > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                Net Outstanding Dues
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: data.summary.outstanding > 0 ? '#dc2626' : '#059669', fontFamily: 'monospace' }}>
                ₹{fmt(data.summary.outstanding)}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          {data.ledger.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '36px 16px', background: '#f8fafc',
              borderRadius: 12, border: '1px dashed rgba(148,163,184,0.25)', color: '#64748b',
            }}>
              <FileText size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>No transaction history found</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Purchase invoices logged or payments recorded for this supplier will appear here.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(148,163,184,0.14)', color: '#64748b', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px' }}>Type & Details</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Debit (Billed)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Credit (Paid)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((entry) => {
                    const isBill = entry.type === 'bill';
                    return (
                      <tr key={`${entry.type}-${entry.id}`} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                        <td style={{ padding: '10px 14px', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {fmtDate(entry.date)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0f172a' }}>
                            {isBill ? <ArrowDownLeft size={14} color="#dc2626" /> : <ArrowUpRight size={14} color="#059669" />}
                            <span>{entry.description}</span>
                            {entry.status && (
                              <span style={{
                                padding: '2px 6px', borderRadius: 4, fontSize: '0.625rem', fontWeight: 700,
                                background: entry.status === 'PAID' ? '#dcfce7' : entry.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                                color: entry.status === 'PAID' ? '#047857' : entry.status === 'PARTIAL' ? '#b45309' : '#b91c1c',
                              }}>
                                {entry.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: isBill ? '#dc2626' : '#94a3b8' }}>
                          {entry.debit > 0 ? `₹${fmt(entry.debit)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: !isBill ? '#059669' : '#94a3b8' }}>
                          {entry.credit > 0 ? `₹${fmt(entry.credit)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {!isBill ? (
                            <button
                              type="button"
                              onClick={() => handleReversePayment(entry.id)}
                              style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: '#ef4444', padding: 4, borderRadius: 4,
                              }}
                              title="Reverse this payment"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Bar */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            paddingTop: 14, marginTop: 14,
            borderTop: '1px solid rgba(148,163,184,0.12)',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0 18px', height: 36, borderRadius: 8, cursor: 'pointer',
                background: '#f1f5f9', border: '1px solid rgba(148,163,184,0.25)',
                color: '#475569', fontSize: '0.8125rem', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            >
              Close History
            </button>
          </div>

          {/* Record Payment Sub-modal */}
          {showPaymentForm && (
            <Modal
              isOpen={showPaymentForm}
              onClose={() => setShowPaymentForm(false)}
              title={`Record Payment for ${data.distributor?.name}`}
            >
              <PaymentForm
                prefillDistributorId={distributorId}
                onClose={() => setShowPaymentForm(false)}
                onSuccess={handlePaymentSuccess}
              />
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

export default DistributorLedger;
