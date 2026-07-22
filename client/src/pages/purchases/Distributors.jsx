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

// Helper to generate consistent colorful avatar style based on name hash
const getAvatarStyle = (name) => {
  const hash = Array.from(name || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: '#eff6ff', color: '#1d4ed8', border: 'rgba(59, 130, 246, 0.2)' },     // Blue
    { bg: '#ecfdf5', color: '#047857', border: 'rgba(16, 185, 129, 0.2)' },    // Emerald
    { bg: '#f5f3ff', color: '#6d28d9', border: 'rgba(109, 40, 217, 0.2)' },    // Purple
    { bg: '#fdf2f8', color: '#be185d', border: 'rgba(219, 39, 119, 0.2)' },    // Pink
    { bg: '#fffbeb', color: '#b45309', border: 'rgba(245, 158, 11, 0.2)' },     // Amber
    { bg: '#ecfeff', color: '#0891b2', border: 'rgba(6, 182, 212, 0.2)' },     // Cyan
    { bg: '#f0fdf4', color: '#15803d', border: 'rgba(22, 163, 74, 0.2)' },     // Green
    { bg: '#faf5ff', color: '#7e22ce', border: 'rgba(126, 34, 206, 0.2)' },    // Violet
  ];
  const theme = colors[hash % colors.length];
  return {
    backgroundColor: theme.bg,
    color: theme.color,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.border,
  };
};

// Helper to extract initials
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

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
    queryFn: (id) => purchaseApi.deleteDistributor(id),
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
        <div className="grid-3 gap-6">
          {distributors.map((d) => (
            <div key={d.id} className={`distributor-card ${d.outstandingDues > 0 ? 'has-dues' : 'no-dues'}`}>
              
              {/* Header details */}
              <div className="distributor-card-header">
                <div className="distributor-avatar" style={getAvatarStyle(d.name)}>
                  {getInitials(d.name)}
                </div>
                <div className="distributor-header-text">
                  <h4 className="distributor-name" title={d.name}>{d.name}</h4>
                  <span className="distributor-credit-pill">
                    {d.creditDays} Days Credit
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="distributor-card-body">
                {d.gstNumber ? (
                  <div className="distributor-gstin font-mono" title="GSTIN Number">
                    <span className="gstin-label">GSTIN:</span> {d.gstNumber}
                  </div>
                ) : (
                  <div className="distributor-gstin no-gstin">No GSTIN provided</div>
                )}

                <div className="distributor-contact-details">
                  {d.contactPerson && (
                    <div className="distributor-detail-row" title="Contact Person">
                      <Award className="detail-icon icon-award" />
                      <span>{d.contactPerson}</span>
                    </div>
                  )}
                  {d.phone && (
                    <div className="distributor-detail-row" title="Phone">
                      <Phone className="detail-icon icon-phone" />
                      <span>{d.phone}</span>
                    </div>
                  )}
                  {d.email && (
                    <div className="distributor-detail-row" title="Email">
                      <Mail className="detail-icon icon-email" />
                      <span className="truncate">{d.email}</span>
                    </div>
                  )}
                  {d.address && (
                    <div className="distributor-detail-row align-start" title="Address">
                      <MapPin className="detail-icon icon-address" />
                      <span className="address-text">{d.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Outstanding dues & action tools */}
              <div className="distributor-card-footer">
                <div className="outstanding-container">
                  <span className="outstanding-label">Outstanding dues</span>
                  <span className={`outstanding-amount ${d.outstandingDues > 0 ? 'dues-positive' : 'dues-zero'}`}>
                    {formatCurrency(d.outstandingDues)}
                  </span>
                </div>

                <div className="distributor-actions">
                  <button
                    type="button"
                    className="distributor-action-btn history-btn"
                    onClick={() => setLedgerDistributorId(d.id)}
                    title="View bill history and transaction ledger"
                  >
                    <FileText size={13} className="action-icon" />
                    History
                  </button>

                  <button
                    type="button"
                    className="distributor-action-btn edit-btn"
                    onClick={() => handleOpenForm(d)}
                    title="Edit supplier profile"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    type="button"
                    className="distributor-action-btn delete-btn"
                    onClick={() => handleDelete(d.id)}
                    title="Delete distributor"
                  >
                    <Trash2 size={13} />
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

