import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { customerApi } from '../../api/customer.api';
import { formatCurrency } from '../../lib/utils';

export function CustomerLedger({ isOpen, onClose, customerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && customerId) {
      setLoading(true);
      setError(null);
      customerApi
        .getCustomerLedger(customerId)
        .then((r) => {
          setData(r.data?.data || null);
        })
        .catch((err) => {
          setError('Failed to load customer ledger.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, customerId]);

  const fmtDate = (d) => {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.customer?.name ? `${data.customer.name}'s Ledger` : 'Customer Ledger'}
      size="lg"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          <span>Loading transaction details...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Customer info card */}
          {data.customer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
              <div>
                <span className="font-semibold text-slate-350">Phone:</span> {data.customer.phone || '—'}
              </div>
              <div>
                <span className="font-semibold text-slate-350">Email:</span> {data.customer.email || '—'}
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-350">Address:</span> {data.customer.address || '—'}
              </div>
            </div>
          )}

          {/* Aggregates Summary */}
          {data.summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Total Purchases (Credit)
                </div>
                <div className="text-lg font-bold text-slate-100">
                  {formatCurrency(data.summary.totalCredit)}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Total Collected
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {formatCurrency(data.summary.totalCollected)}
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Net Outstanding
                </div>
                <div
                  className={`text-lg font-bold ${
                    data.summary.outstanding > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(data.summary.outstanding)}
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Transaction Details</th>
                    <th className="px-4 py-3 text-right">Debit (Dr)</th>
                    <th className="px-4 py-3 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.ledger && data.ledger.length > 0 ? (
                    data.ledger.map((entry) => (
                      <tr
                        key={`${entry.type}-${entry.id}`}
                        className={`hover:bg-slate-900/30 transition-colors ${
                          entry.type === 'credit' ? 'bg-red-500/[0.01]' : 'bg-emerald-500/[0.01]'
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-450">
                          {fmtDate(entry.date)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200">
                              {entry.description}
                            </span>
                            {entry.status && (
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                                  entry.status === 'PAID'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : entry.status === 'PARTIAL'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {entry.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-red-400 tabular-nums">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-400 tabular-nums">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                        No transactions registered in ledger yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end pt-2">
        <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
          Close Ledger
        </button>
      </div>
    </Modal>
  );
}
export default CustomerLedger;
