// src/components/history/HistoryModal.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, Calendar, Search, Download, Printer, ArrowUpRight, 
  ArrowDownLeft, TrendingUp, TrendingDown, Landmark, Wallet, 
  BarChart3, FileSpreadsheet, RefreshCw, Trash2, ArrowLeftRight
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export function HistoryModal({ isOpen, onClose, type = 'expenses' }) {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState(type === 'expenses' ? format(new Date(), 'yyyy-MM-dd') : '');
  const [endDate, setEndDate] = useState(type === 'expenses' ? format(new Date(), 'yyyy-MM-dd') : '');
  const [page, setPage] = useState(1);

  // Determine query based on type
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history-modal', type, { page, search, selectedMonth, selectedYear, startDate, endDate }],
    queryFn: () => {
      const params = { page, limit: 50, search, month: selectedMonth, year: selectedYear, startDate, endDate };
      if (type === 'expenses') return dashboardApi.getExpenseHistory(params).then((r) => r.data);
      if (type === 'cash') return dashboardApi.getCashHistory(params).then((r) => r.data);
      if (type === 'bank') return dashboardApi.getBankHistory(params).then((r) => r.data);
      if (type === 'revenue') return dashboardApi.getRevenueHistory(params).then((r) => r.data);
      return dashboardApi.getExpenseHistory(params).then((r) => r.data);
    },
    enabled: isOpen,
  });

  const summary = data?.summary || {};
  const historyList = data?.data || [];
  const pagination = data?.pagination || {};

  // Config titles
  const modalTitles = {
    expenses: "History: Today's & Operating Expenses",
    cash: 'History: Cash in Hand & Ledger',
    bank: 'History: Bank Balance & Transactions',
    revenue: 'History: Monthly Revenue & Sales',
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!historyList || historyList.length === 0) return;
    let csvRows = [];

    if (type === 'expenses') {
      csvRows.push('"Date","Time","Category","Description","Amount","Running Total","Added By"');
      historyList.forEach((item) => {
        const dateStr = item.date ? format(new Date(item.date), 'dd MMM yyyy') : '';
        csvRows.push(`"${dateStr}","${item.time || ''}","${item.category || ''}","${(item.description || '').replace(/"/g, '""')}","${item.amount}","${item.runningTotal}","${item.addedBy || ''}"`);
      });
    } else if (type === 'cash') {
      csvRows.push('"Date","Opening Cash","Cash Sales","Cash Expenses","Cash Deposit","Cash Withdrawn","Closing Cash"');
      historyList.forEach((item) => {
        const dateStr = item.date ? format(new Date(item.date), 'dd MMM yyyy') : '';
        csvRows.push(`"${dateStr}","${item.openingCash}","${item.cashSales}","${item.cashExpenses}","${item.cashDeposits}","${item.cashWithdrawn}","${item.closingCash}"`);
      });
    } else if (type === 'bank') {
      csvRows.push('"Date","Opening Balance","UPI Collection","Cash Deposited","Bank Expense","Bank Withdrawal","Closing Balance"');
      historyList.forEach((item) => {
        const dateStr = item.date ? format(new Date(item.date), 'dd MMM yyyy') : '';
        csvRows.push(`"${dateStr}","${item.openingBalance}","${item.upiCollection}","${item.cashDeposited}","${item.bankExpense}","${item.bankWithdrawal}","${item.closingBalance}"`);
      });
    } else {
      csvRows.push('"Date","Cash Sales","UPI Sales","Card Sales","Credit Sales","Total Revenue"');
      historyList.forEach((item) => {
        const dateStr = item.date ? format(new Date(item.date), 'dd MMM yyyy') : '';
        csvRows.push(`"${dateStr}","${item.cashSales}","${item.upiSales}","${item.cardSales}","${item.creditSales}","${item.totalRevenue}"`);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${type}_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '840px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          color: '#0f172a',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f1f5f9',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {modalTitles[type] || 'Transaction History'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            background: '#ffffff',
          }}
        >
          {/* Summary Cards Row (matching screenshot design) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              padding: 16,
              background: '#f8fafc',
              borderRadius: 16,
              border: '1px solid #f1f5f9',
            }}
          >
            {type === 'expenses' && (
              <>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Transactions</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{summary.totalTransactions || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: 2 }}>{formatCurrency(summary.totalExpense || 0)}</div>
                </div>
              </>
            )}

            {type === 'cash' && (
              <>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Sales</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>{formatCurrency(summary.totalCashSales || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Expenses</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: 2 }}>{formatCurrency(summary.totalCashExpenses || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Deposits</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6', marginTop: 2 }}>{formatCurrency(summary.totalDeposits || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Balance</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{formatCurrency(summary.currentCashBalance || 0)}</div>
                </div>
              </>
            )}

            {type === 'bank' && (
              <>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPI Collection</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6', marginTop: 2 }}>{formatCurrency(summary.totalUPICollection || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Deposited</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>{formatCurrency(summary.totalDeposits || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Expenses</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: 2 }}>{formatCurrency(summary.totalExpenses || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Bank Bal</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{formatCurrency(summary.currentBankBalance || 0)}</div>
                </div>
              </>
            )}

            {type === 'revenue' && (
              <>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monthly Revenue</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>{formatCurrency(summary.monthlyRevenue || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Revenue</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{formatCurrency(summary.cashRevenue || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Digital Revenue</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6', marginTop: 2 }}>{formatCurrency(summary.digitalRevenue || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Daily Rev</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', marginTop: 2 }}>{formatCurrency(summary.avgDailyRevenue || 0)}</div>
                </div>
              </>
            )}
          </div>

          {/* Quick Filter & Export Toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {type === 'expenses' && (
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    style={{
                      padding: '6px 12px 6px 30px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '12px',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />

              {(startDate || endDate || search) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); }}
                  style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ display: 'flex', items: 'center', gap: 8 }}>
              <button
                onClick={handleExportCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                <FileSpreadsheet size={14} color="#10b981" />
                Export Excel
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} color="#3b82f6" />
                Print / PDF
              </button>
            </div>
          </div>

          {/* History Item Cards / Table (Matching screenshot card layout) */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 30, color: '#64748b', gap: 8 }}>
              <RefreshCw size={24} className="animate-spin text-emerald-500" />
              <span style={{ fontSize: '13px' }}>Loading history entries...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 30, color: '#94a3b8', gap: 8 }}>
              <span style={{ fontSize: '13px' }}>No history records found for the selected range.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {type === 'expenses' &&
                historyList.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(239, 68, 68, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444',
                          fontWeight: 700,
                        }}
                      >
                        <ArrowUpRight size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          EXPENSE RECORD • {exp.category || 'Miscellaneous'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                          {exp.description}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                          Time: {exp.time} • Added by {exp.addedBy}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        {exp.date ? format(new Date(exp.date), 'dd MMM yyyy') : ''}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626', marginTop: 2 }}>
                        - {formatCurrency(Number(exp.amount))}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginTop: 2 }}>
                        Running Bal: {formatCurrency(Number(exp.runningTotal))}
                      </div>
                    </div>
                  </div>
                ))}

              {type === 'cash' &&
                historyList.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(245, 158, 11, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f59e0b',
                        }}
                      >
                        <Wallet size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          DAILY CASH LEDGER ENTRY
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
                          Opening: {formatCurrency(Number(entry.openingCash))} | Sales: +{formatCurrency(Number(entry.cashSales))} | Exp: -{formatCurrency(Number(entry.cashExpenses))} | Deposit: -{formatCurrency(Number(entry.cashDeposits))}
                        </div>
                        {entry.notes && <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Note: {entry.notes}</div>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : ''}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                        Closing: {formatCurrency(Number(entry.closingCash))}
                      </div>
                    </div>
                  </div>
                ))}

              {type === 'bank' &&
                historyList.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(59, 130, 246, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#3b82f6',
                        }}
                      >
                        <Landmark size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          BANK BALANCE ENTRY
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
                          Opening: {formatCurrency(Number(entry.openingBalance))} | UPI: +{formatCurrency(Number(entry.upiCollection))} | Deposit: +{formatCurrency(Number(entry.cashDeposited))} | Exp: -{formatCurrency(Number(entry.bankExpense))}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : ''}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                        Closing: {formatCurrency(Number(entry.closingBalance))}
                      </div>
                    </div>
                  </div>
                ))}

              {type === 'revenue' &&
                historyList.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(16, 185, 129, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10b981',
                        }}
                      >
                        <BarChart3 size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          DAILY REVENUE ENTRY
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: 2 }}>
                          Cash: {formatCurrency(Number(entry.cashSales))} | UPI: {formatCurrency(Number(entry.upiSales))} | Card: {formatCurrency(Number(entry.cardSales))} | Credit: {formatCurrency(Number(entry.creditSales))}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        {entry.date ? format(new Date(entry.date), 'dd MMM yyyy') : ''}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                        Total: {formatCurrency(Number(entry.totalRevenue))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Modal Footer (matching screenshot status & close button) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
            Status: <span style={{ color: '#0f172a', fontWeight: 700 }}>ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: 12,
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
    </div>
  );
}
