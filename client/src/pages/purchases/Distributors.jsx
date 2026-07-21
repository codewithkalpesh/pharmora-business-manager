// src/pages/purchases/Distributors.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit, Trash2, Phone, Mail, MapPin, 
  RefreshCw, Users, ShieldAlert, Award, FileText, Search
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { purchaseApi } from '../../api/purchase.api';
import { formatCurrency } from '../../lib/utils';
import DistributorForm from './DistributorForm';
import DistributorLedger from '../payments/DistributorLedger';

export function Distributors() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDist, setEditingDist] = useState(null);
  const [ledgerDistributorId, setLedgerDistributorId] = useState(null);
  const [search, setSearch] = useState('');

  // Fetch distributors list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['distributors', { search }],
    queryFn: () => purchaseApi.getDistributors({ search }).then((r) => r.data.data),
  });

  const distributors = data?.distributors || [];

  // Open modal for Create/Edit
  const handleOpenForm = (dist = null) => {
    setEditingDist(dist);
    setIsFormOpen(true);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => purchaseApi.deleteDistributor(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['distributors']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete distributor.');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this distributor profile? This will fail if bills are logged.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <PageHeader
        title="Distributors Directory"
        subtitle="Manage supplier profiles, contact information, GSTIN details, and outstanding balances"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="btn btn-primary btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 font-semibold" onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4" />
              Add Supplier
            </button>
          </div>
        }
      />

      {/* Filter / Search section */}
      <div style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <div className="input-wrapper">
          <Search className="input-icon" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name or GST..."
            className="input"
          />
        </div>
      </div>

      {/* Grid list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          <span>Loading suppliers...</span>
        </div>
      ) : distributors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {distributors.map((d) => (
            <div key={d.id} className="card relative border border-slate-800/80 bg-slate-900/40 p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4">
              
              {/* Header details */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-semibold text-slate-100 truncate max-w-[80%]">{d.name}</h4>
                  <span className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-slate-855 text-slate-400 font-semibold uppercase">
                    {d.creditDays} Days Credit
                  </span>
                </div>
                {d.gstNumber ? (
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase font-mono">{d.gstNumber}</span>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">No GSTIN provided</span>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-2 border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                {d.contactPerson && (
                  <div className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-350">{d.contactPerson}</span>
                  </div>
                )}
                {d.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{d.phone}</span>
                  </div>
                )}
                {d.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{d.email}</span>
                  </div>
                )}
                {d.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{d.address}</span>
                  </div>
                )}
              </div>

              {/* Outstanding dues & action tools */}
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-auto">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Outstanding dues</span>
                  <span className={`text-sm font-bold font-mono ${d.outstandingDues > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {formatCurrency(d.outstandingDues)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLedgerDistributorId(d.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid rgba(148,163,184,0.2)',
                      color: '#cbd5e1',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    title="View bill history and transaction ledger"
                  >
                    <FileText size={13} color="#10b981" />
                    History
                  </button>

                  <button
                    onClick={() => handleOpenForm(d)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                    title="Edit supplier profile"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                    title="Delete distributor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3 card bg-slate-900/20 border border-slate-800">
          <Users className="h-10 w-10 text-slate-655" />
          <h4 className="text-slate-350 font-semibold">No suppliers added yet</h4>
          <p className="text-xs">Click "Add Supplier" to start building your distributor directory.</p>
        </div>
      )}

      {/* Supplier Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDist ? 'Edit Distributor Profile' : 'Add New Distributor'}
      >
        <DistributorForm
          initialData={editingDist}
          onSuccess={() => {
            setIsFormOpen(false);
            queryClient.invalidateQueries(['distributors']);
          }}
          onClose={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Ledger History Modal */}
      {ledgerDistributorId && (
        <Modal
          isOpen={!!ledgerDistributorId}
          onClose={() => setLedgerDistributorId(null)}
          title="Distributor Transaction History & Ledger"
          size="lg"
        >
          <DistributorLedger
            distributorId={ledgerDistributorId}
            onClose={() => setLedgerDistributorId(null)}
            onSync={() => queryClient.invalidateQueries(['distributors'])}
          />
        </Modal>
      )}
    </div>
  );
}
export default Distributors;

