// src/components/history/FilterBar.jsx
import React from 'react';
import { Calendar, Search, RotateCcw } from 'lucide-react';

export function FilterBar({
  search,
  setSearch,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onReset,
  showSearch = true,
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="card bg-slate-900/60 border border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-3 items-center flex-1">
        {showSearch && (
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400 text-[11px]">Month:</span>
            <input
              type="month"
              value={selectedMonth || ''}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (setSelectedYear) setSelectedYear('');
                if (setStartDate) setStartDate('');
                if (setEndDate) setEndDate('');
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            />
          </div>

          {setSelectedYear && (
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px]">Year:</span>
              <select
                value={selectedYear || ''}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  if (setSelectedMonth) setSelectedMonth('');
                  if (setStartDate) setStartDate('');
                  if (setEndDate) setEndDate('');
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-slate-200">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <span className="text-slate-500 font-semibold px-1 text-[11px]">or Range:</span>

          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (setSelectedMonth) setSelectedMonth('');
              if (setSelectedYear) setSelectedYear('');
            }}
            className="rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-[11px] text-slate-200 focus:outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (setSelectedMonth) setSelectedMonth('');
              if (setSelectedYear) setSelectedYear('');
            }}
            className="rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-[11px] text-slate-200 focus:outline-none"
          />
        </div>

        {(search || selectedMonth || selectedYear || startDate || endDate) && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100 transition-colors ml-auto md:ml-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
