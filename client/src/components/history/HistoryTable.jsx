// src/components/history/HistoryTable.jsx
import React from 'react';
import { RefreshCw, AlertCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export function HistoryTable({
  columns = [],
  data = [],
  isLoading = false,
  isError = false,
  error = null,
  pagination = {},
  page = 1,
  setPage = () => {},
  emptyMessage = 'No history records found.',
  renderRow,
}) {
  return (
    <div className="card p-0 overflow-hidden border border-slate-800 bg-slate-900/40">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          <span>Loading ledger history...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-12 text-red-400 space-y-3">
          <AlertCircle className="h-8 w-8" />
          <span>Failed to load history: {error?.message || 'Server error'}</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
          <Inbox className="h-10 w-10 text-slate-600" />
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md text-slate-400 text-xs font-semibold uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th key={idx} className={`p-4 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
              {data.map((row, index) => renderRow(row, index))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <div>
            Showing <span className="font-medium text-slate-200">{((page - 1) * (pagination.limit || 30)) + 1}</span> to{' '}
            <span className="font-medium text-slate-200">{Math.min(page * (pagination.limit || 30), pagination.total || 0)}</span> of{' '}
            <span className="font-medium text-slate-200">{pagination.total || 0}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-300">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
