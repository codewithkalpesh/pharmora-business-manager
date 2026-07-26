// src/components/history/ExportButtons.jsx
import React from 'react';
import { Download, Printer, FileSpreadsheet, FileText } from 'lucide-react';

export function ExportButtons({ title = 'History Report', headers = [], data = [], filename = 'report' }) {
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvRows = [];
    // Header row
    csvRows.push(headers.map((h) => `"${h.label}"`).join(','));

    // Data rows
    data.forEach((row) => {
      const values = headers.map((h) => {
        let val = row[h.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handleExportCSV}
        className="btn btn-secondary btn-sm flex items-center gap-1.5 bg-slate-900 text-slate-200 hover:bg-slate-800 border-slate-700"
        title="Export to Excel / CSV"
      >
        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
        <span className="hidden sm:inline">Export Excel</span>
      </button>

      <button
        onClick={handlePrint}
        className="btn btn-secondary btn-sm flex items-center gap-1.5 bg-slate-900 text-slate-200 hover:bg-slate-800 border-slate-700"
        title="Print or Save as PDF"
      >
        <Printer className="h-4 w-4 text-blue-400" />
        <span className="hidden sm:inline">Print / PDF</span>
      </button>
    </div>
  );
}
