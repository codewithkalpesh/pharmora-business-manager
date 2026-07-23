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
    if (type === 'DEPOSIT') return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
    if (type === 'WITHDRAWAL') return <ArrowUpRight className="h-4 w-4 text-red-400" />;
    return <ArrowLeftRight className="h-4 w-4 text-blue-400" />;
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
                className="btn btn-primary btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 font-semibold"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="kpi-card">
            <div className="kpi-label">Total Bank Balance</div>
            <div className="kpi-value text-emerald-400">{formatCurrency(stats.totalBalance)}</div>
            <div className="text-[11px] text-slate-450 mt-1">{stats.accountCount} active accounts</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Deposits This Month</div>
            <div className="kpi-value text-green-400">{formatCurrency(stats.monthDeposits)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Withdrawals This Month</div>
            <div className="kpi-value text-red-400">{formatCurrency(stats.monthWithdrawals)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Net Cash Flow (Month)</div>
            <div className={`kpi-value ${stats.monthDeposits - stats.monthWithdrawals >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(stats.monthDeposits - stats.monthWithdrawals)}
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Cards */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {accounts.map((a) => (
            <div
              key={a.id}
              className={`card relative border p-5 transition-all ${
                a.isPrimary
                  ? 'border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-400" />
                    <h4 className="text-sm font-bold text-slate-100">{a.bankName}</h4>
                    {a.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.accountName}</div>
                </div>
                {isOwnerOrManager && (
                  <div className="flex gap-1">
                    {!a.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(a.id)}
                        className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                        title="Set as Primary Account"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAccount(a)}
                      className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(a.id)}
                      className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold text-slate-50 mt-2 tabular-nums">
                {formatCurrency(a.currentBalance)}
              </div>

              <div className="flex justify-between mt-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                <span>A/C: {maskAccNo(a.accountNumber)}</span>
                {a.ifscCode && <span>IFSC: {a.ifscCode}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
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

        <div className="flex gap-2 items-center text-xs text-slate-400">
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
      <div className="card-glass border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            <span>Loading transactions...</span>
          </div>
        ) : transactions.length > 0 ? (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Account</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-right">Running Bal.</th>
                {isOwnerOrManager && <th className="px-5 py-3.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {txnIcon(t.type)}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        t.type === 'DEPOSIT' ? 'text-emerald-400' :
                        t.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {t.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">{fmtDate(t.date)}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-200">{t.account?.bankName}</div>
                    <div className="text-[10px] text-slate-500">{t.account?.accountName}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-200 max-w-[200px] truncate">
                    {t.description}
                    {t.type === 'TRANSFER' && t.transferTo && (
                      <div className="text-[10px] text-blue-400 mt-0.5">
                        → {t.transferTo.bankName} — {t.transferTo.accountName}
                      </div>
                    )}
                    {t.transferFrom && (
                      <div className="text-[10px] text-blue-400 mt-0.5">
                        ← {t.transferFrom.bankName} — {t.transferFrom.accountName}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-450">{t.referenceNo || '—'}</td>
                  <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${
                    t.type === 'DEPOSIT' ? 'text-emerald-400' : t.type === 'WITHDRAWAL' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {t.type === 'DEPOSIT' ? '+' : t.type === 'WITHDRAWAL' ? '-' : '↔'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-300 font-semibold tabular-nums">
                    {formatCurrency(t.runningBalance)}
                  </td>
                  {isOwnerOrManager && (
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-red-400 transition-colors"
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
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
            <Building2 className="h-10 w-10 text-slate-650" />
            <h4 className="text-slate-350 font-semibold">No transactions found</h4>
            <p className="text-xs">Record deposits, withdrawals, or transfers to track bank activity.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-850 p-4 rounded-xl">
          <span className="text-xs text-slate-450">{totalRecords} transactions found</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="btn btn-secondary btn-sm">Previous</button>
            <span className="text-xs text-slate-300 px-2 font-medium">Page {page} of {totalPages}</span>
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
