import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, RefreshCw, Plus, ArrowDownLeft, ArrowUpRight,
  ArrowLeftRight, Trash2, Edit, Search, CreditCard, Star,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { bankApi } from '../../api/bank.api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';
import BankAccountForm from './BankAccountForm';
import BankTransactionForm from './BankTransactionForm';

export function Banks() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);

  // Filters
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const isOwnerOrManager = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const loadStats = useCallback(async () => {
    try {
      const res = await bankApi.getBankStats();
      setStats(res.data?.data || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await bankApi.getAccounts({ limit: 50 });
      setAccounts(res.data?.accounts || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadTransactions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        limit: 20,
        accountId: filterAccount || undefined,
        type: filterType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await bankApi.getTransactions(params);
      setTransactions(res.data?.transactions || []);
      setPage(res.data?.pagination?.page || 1);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalRecords(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterAccount, filterType, startDate, endDate]);

  const fetchAll = useCallback(() => {
    loadStats();
    loadAccounts();
    loadTransactions(1);
  }, [loadStats, loadAccounts, loadTransactions]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => { setPage(1); }, [filterAccount, filterType, startDate, endDate]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) loadTransactions(newPage);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleSetPrimary = async (id) => {
    try {
      await bankApi.setPrimaryAccount(id);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to set primary bank account.');
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Delete this bank account? All transactions will be lost.')) return;
    try {
      await bankApi.deleteAccount(id);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete bank account.');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction? Account balances will be automatically reversed.')) return;
    try {
      await bankApi.deleteTransaction(id);
      fetchAll();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete transaction.');
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const maskAccNo = (num) => {
    if (!num || num.length < 5) return num || '—';
    return '●●●●' + num.slice(-4);
  };

  const txnIcon = (type) => {
    if (type === 'DEPOSIT') return <ArrowDownLeft className="h-4 w-4 text-success" />;
    if (type === 'WITHDRAWAL') return <ArrowUpRight className="h-4 w-4 text-error" />;
    return <ArrowLeftRight className="h-4 w-4 text-info" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts & Transactions"
        subtitle="Manage bank accounts, track deposits, withdrawals, and inter-bank transfers"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsTxnModalOpen(true)}
            >
              <CreditCard className="h-4 w-4" /> Record Transaction
            </button>
            {isOwnerOrManager && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddAccount}
              >
                <Plus className="h-4 w-4" /> Add Account
              </button>
            )}
          </div>
        }
      />

      {/* KPI Stats */}
      {stats && (
        <div className="grid-4 mb-6">
          <div className="kpi-card">
            <div className="kpi-label">Total Bank Balance</div>
            <div className="kpi-value text-success">{formatCurrency(stats.totalBalance)}</div>
            <div className="text-xs text-muted mt-1">{stats.accountCount} active accounts</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Deposits This Month</div>
            <div className="kpi-value text-success">{formatCurrency(stats.monthDeposits)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Withdrawals This Month</div>
            <div className="kpi-value text-error">{formatCurrency(stats.monthWithdrawals)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Net Cash Flow (Month)</div>
            <div className={`kpi-value ${stats.monthDeposits - stats.monthWithdrawals >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(stats.monthDeposits - stats.monthWithdrawals)}
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Cards */}
      {accounts.length > 0 && (
        <div className="grid-3 mb-6">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="card relative flex flex-col justify-between transition-all"
              style={{
                borderLeft: a.isPrimary ? '4px solid var(--warning)' : '4px solid var(--info)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <h4 className="text-sm font-bold text-slate-800">{a.bankName}</h4>
                    {a.isPrimary && (
                      <span className="badge badge-warning">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5">{a.accountName}</div>
                </div>
                {isOwnerOrManager && (
                  <div className="flex gap-1">
                    {!a.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(a.id)}
                        className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-warning transition-colors"
                        title="Set as Primary Account"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAccount(a)}
                      className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(a.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
                {formatCurrency(a.currentBalance)}
              </div>

              <div className="flex justify-between mt-3 text-xs text-muted font-mono">
                <span>A/C: {maskAccNo(a.accountNumber)}</span>
                {a.ifscCode && <span>IFSC: {a.ifscCode}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Filters */}
      <div className="card flex flex-wrap gap-4 items-center p-4 mb-6 shadow-sm">
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="input"
          style={{ width: '220px' }}
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bankName} — {a.accountName}
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input"
          style={{ width: '160px' }}
        >
          <option value="">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="TRANSFER">Transfer</option>
        </select>

        <div className="flex gap-2 items-center text-xs text-muted">
          <span>Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input py-1"
            style={{ width: '130px', height: '34px' }}
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input py-1"
            style={{ width: '130px', height: '34px' }}
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="table-wrapper mb-6 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
            <span>Loading transactions...</span>
          </div>
        ) : transactions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Account</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Running Bal.</th>
                {isOwnerOrManager && <th className="text-center">Action</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {txnIcon(t.type)}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        t.type === 'DEPOSIT' ? 'text-success' :
                        t.type === 'WITHDRAWAL' ? 'text-error' : 'text-info'
                      }`}>
                        {t.type}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-muted">{fmtDate(t.date)}</td>
                  <td>
                    <div className="font-semibold text-slate-800">{t.account?.bankName}</div>
                    <div className="text-[10px] text-muted">{t.account?.accountName}</div>
                  </td>
                  <td className="text-slate-700 max-w-[200px] truncate">
                    {t.description}
                    {t.type === 'TRANSFER' && t.transferTo && (
                      <div className="text-[10px] text-info mt-0.5">
                        → {t.transferTo.bankName} — {t.transferTo.accountName}
                      </div>
                    )}
                    {t.transferFrom && (
                      <div className="text-[10px] text-info mt-0.5">
                        ← {t.transferFrom.bankName} — {t.transferFrom.accountName}
                      </div>
                    )}
                  </td>
                  <td className="text-muted">{t.referenceNo || '—'}</td>
                  <td className={`text-right font-bold font-mono ${
                    t.type === 'DEPOSIT' ? 'text-success' : t.type === 'WITHDRAWAL' ? 'text-error' : 'text-info'
                  }`}>
                    {t.type === 'DEPOSIT' ? '+' : t.type === 'WITHDRAWAL' ? '-' : '↔'} {formatCurrency(t.amount)}
                  </td>
                  <td className="text-right text-slate-800 font-semibold font-mono">
                    {formatCurrency(t.runningBalance)}
                  </td>
                  {isOwnerOrManager && (
                    <td className="text-center">
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-error transition-colors"
                        title="Delete transaction (reverses balance)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-muted space-y-3">
            <Building2 className="h-10 w-10 text-slate-400" />
            <h4 className="text-slate-750 font-semibold">No transactions found</h4>
            <p className="text-xs">Record deposits, withdrawals, or transfers to track bank activity.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card flex justify-between items-center p-4">
          <span className="text-xs text-muted">{totalRecords} transactions found</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="btn btn-secondary btn-sm">Previous</button>
            <span className="text-xs text-slate-800 px-2 font-medium">Page {page} of {totalPages}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="btn btn-secondary btn-sm">Next</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BankAccountForm
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={fetchAll}
        account={editingAccount}
      />
      <BankTransactionForm
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        onSuccess={fetchAll}
      />
    </div>
  );
}
export default Banks;
