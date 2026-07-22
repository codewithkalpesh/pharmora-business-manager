// src/pages/payments/Payments.jsx
import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { getPayments, deletePayment, getPaymentStats } from '../../api/payment.api';
import { purchaseApi } from '../../api/purchase.api';
import { PaymentForm } from './PaymentForm';
import { DistributorLedger } from './DistributorLedger';
import Modal from '../../components/common/Modal';
import styles from './Payments.module.css';


const fmt = (n) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const MODE_LABELS = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

export function Payments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    distributorId: '',
    paymentMode: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [ledgerDistributorId, setLedgerDistributorId] = useState(null);

  const loadDistributors = useCallback(async () => {
    try {
      const r = await purchaseApi.getDistributors({ limit: 200 });
      const list = r.data?.data?.distributors || r.data?.distributors || [];
      setDistributors(list);
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const r = await getPaymentStats();
      setStats(r.data);
    } catch {}
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const r = await getPayments(params);
      setPayments(r.payments || []);
      setPagination(r.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadDistributors();
    loadStats();
  }, [loadDistributors, loadStats]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleFilter = (field, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [field]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({
      distributorId: '',
      paymentMode: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => !!v);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment transaction? This will update the outstanding balance for the distributor.')) return;
    try {
      await deletePayment(id);
      loadPayments();
      loadStats();
      loadDistributors();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete payment.');
    }
  };

  const onFormSuccess = () => {
    loadPayments();
    loadStats();
    loadDistributors();
  };

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <h1>💳 Distributor Payments</h1>
          <p>Record and track payments made to medicine suppliers</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          + Record Payment
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Outstanding Dues</span>
            <span className={`${styles.statValue} ${stats.outstandingDues > 0 ? styles.danger : ''}`}>
              ₹{fmt(stats.outstandingDues)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Paid This Month</span>
            <span className={`${styles.statValue} ${styles.success}`}>
              ₹{fmt(stats.paidThisMonth)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Paid (All Time)</span>
            <span className={styles.statValue}>₹{fmt(stats.totalPaidAllTime)}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={filters.distributorId}
          onChange={(e) => handleFilter('distributorId', e.target.value)}
          title="Filter by distributor"
        >
          <option value="">All Distributors ({distributors.length})</option>
          {distributors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.outstandingDues > 0 ? `(Dues: ₹${Number(d.outstandingDues).toLocaleString('en-IN')})` : ''}
            </option>
          ))}
        </select>

        <select
          value={filters.paymentMode}
          onChange={(e) => handleFilter('paymentMode', e.target.value)}
        >
          <option value="">All Modes</option>
          {Object.entries(MODE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilter('startDate', e.target.value)}
          title="From date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilter('endDate', e.target.value)}
          title="To date"
        />

        {hasActiveFilters && (
          <button
            style={{
              background: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.3)',
              color: '#475569',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
            onClick={resetFilters}
          >
            ✕ Reset Filters
          </button>
        )}

        {filters.distributorId && (
          <button
            style={{
              background: 'transparent',
              border: '1px solid rgba(165,180,252,0.3)',
              color: '#a5b4fc',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setLedgerDistributorId(filters.distributorId)}
          >
            📋 View Ledger
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadingState}>Loading payments…</div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyState}>
            <span style={{ fontSize: '2.5rem' }}>💸</span>
            <p>No payments recorded yet. Start by recording your first payment.</p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Distributor</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.distributorName}>{p.distributor?.name}</div>
                      {p.bill && (
                        <div className={styles.invoiceRef}>Invoice #{p.bill.invoiceNo}</div>
                      )}
                    </td>
                    <td>{fmtDate(p.paymentDate)}</td>
                    <td>
                      <span className={styles.modeBadge}>
                        {MODE_LABELS[p.paymentMode] || p.paymentMode}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {p.referenceNo || '—'}
                    </td>
                    <td className={styles.amountCell}>₹{fmt(p.amount)}</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleDelete(p.id)}
                        title="Delete this payment"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  ← Prev
                </button>
                <span>
                  Page {page} of {pagination.totalPages} ({pagination.total} records)
                </span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Record Distributor Payment"
      >
        <PaymentForm
          onClose={() => setShowForm(false)}
          onSuccess={onFormSuccess}
        />
      </Modal>

      {/* Ledger Modal */}
      {ledgerDistributorId && (
        <DistributorLedger
          distributorId={ledgerDistributorId}
          onClose={() => setLedgerDistributorId(null)}
        />
      )}
    </div>
  );
}
