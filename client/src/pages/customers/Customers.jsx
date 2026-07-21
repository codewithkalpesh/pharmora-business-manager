import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, RefreshCw, Plus, CreditCard, Receipt, 
  Trash2, Edit, Phone, Mail, MapPin, Search, AlertCircle
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { customerApi } from '../../api/customer.api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';
import CustomerForm from './CustomerForm';
import CustomerCreditForm from './CustomerCreditForm';
import CreditCollectionForm from './CreditCollectionForm';
import CustomerLedger from './CustomerLedger';

export function Customers() {
  const { user } = useAuth();
  
  // Tabs: 'directory' | 'credits' | 'collections'
  const [activeTab, setActiveTab] = useState('directory');
  
  // States
  const [customers, setCustomers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [collections, setCollections] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [creditStatus, setCreditStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [prefillCreditCustomerId, setPrefillCreditCustomerId] = useState(null);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [prefillCollectionCustomerId, setPrefillCollectionCustomerId] = useState(null);
  
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerCustomerId, setLedgerCustomerId] = useState(null);

  const [loading, setLoading] = useState(false);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await customerApi.getCustomerStats();
      setStats(res.data?.data || null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load Customers
  const loadCustomers = useCallback(async (pageVal = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pageVal,
        limit: 15,
        search: searchQuery || undefined,
      };
      const res = await customerApi.getCustomers(params);
      setCustomers(res.data?.customers || []);
      setCurrentPage(res.data?.pagination?.page || 1);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalRecords(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load Credits
  const loadCredits = useCallback(async (pageVal = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pageVal,
        limit: 15,
        status: creditStatus || undefined,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await customerApi.getCredits(params);
      setCredits(res.data?.credits || []);
      setCurrentPage(res.data?.pagination?.page || 1);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalRecords(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [creditStatus, searchQuery, startDate, endDate]);

  // Load Collections
  const loadCollections = useCallback(async (pageVal = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pageVal,
        limit: 15,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await customerApi.getCollections(params);
      setCollections(res.data?.collections || []);
      setCurrentPage(res.data?.pagination?.page || 1);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalRecords(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Combined fetch trigger
  const fetchData = useCallback(() => {
    loadStats();
    if (activeTab === 'directory') {
      loadCustomers(1);
    } else if (activeTab === 'credits') {
      loadCredits(1);
    } else if (activeTab === 'collections') {
      loadCollections(1);
    }
  }, [activeTab, loadStats, loadCustomers, loadCredits, loadCollections]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination on tab change or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, creditStatus, startDate, endDate]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (activeTab === 'directory') loadCustomers(newPage);
    else if (activeTab === 'credits') loadCredits(newPage);
    else if (activeTab === 'collections') loadCollections(newPage);
  };

  // Actions
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleAddCredit = (customerId = null) => {
    setPrefillCreditCustomerId(customerId);
    setIsCreditModalOpen(true);
  };

  const handleAddCollection = (customerId = null) => {
    setPrefillCollectionCustomerId(customerId);
    setIsCollectionModalOpen(true);
  };

  const handleOpenLedger = (customerId) => {
    setLedgerCustomerId(customerId);
    setIsLedgerOpen(true);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This operation cannot be reversed.')) return;
    try {
      await customerApi.deleteCustomer(id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const handleDeleteCredit = async (id) => {
    if (!window.confirm('Delete this credit entry? This will revert any outstanding logs.')) return;
    try {
      await customerApi.deleteCredit(id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete credit entry.');
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm('Reverse this collection receipt? The customer balance will update.')) return;
    try {
      await customerApi.deleteCollection(id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete collection receipt.');
    }
  };

  const fmtDate = (d) => {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isAccessAuthorized = user?.role === 'OWNER' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Credits & Directory"
        subtitle="Manage customer account profiles, track credit purchases, and record payment collections"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="btn btn-primary btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-slate-950 font-semibold" onClick={handleAddCustomer}>
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        }
      />

      {/* KPI Stats block */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="kpi-card">
            <div className="kpi-label">Outstanding Customer Credit</div>
            <div className="kpi-value text-red-400">{formatCurrency(stats.outstandingCredit)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Collections Received (This Month)</div>
            <div className="kpi-value text-emerald-400">{formatCurrency(stats.monthCollections)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Overdue Credit Amount</div>
            <div className="kpi-value text-amber-500">
              {formatCurrency(stats.overdueAmount)}
              <span className="text-xs text-slate-450 block font-normal mt-1">
                Across {stats.overdueCount} entries
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="border-b border-slate-800 flex gap-4">
        <button
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'directory'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => {
            setActiveTab('directory');
            setSearchQuery('');
          }}
        >
          Customer Directory
        </button>
        <button
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'credits'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => {
            setActiveTab('credits');
            setSearchQuery('');
          }}
        >
          Credit Ledger
        </button>
        <button
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'collections'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => {
            setActiveTab('collections');
          }}
        >
          Collections Received
        </button>
      </div>

      {/* Search / Filtering Row */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
        {activeTab !== 'collections' && (
          <div className="input-wrapper" style={{ minWidth: '280px' }}>
            <Search className="input-icon" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'directory'
                  ? 'Search by name or phone...'
                  : 'Search by description/reference...'
              }
              className="input"
            />
          </div>
        )}

        {activeTab === 'credits' && (
          <select
            value={creditStatus}
            onChange={(e) => setCreditStatus(e.target.value)}
            className="input"
            style={{ width: '160px' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        )}

        {(activeTab === 'credits' || activeTab === 'collections') && (
          <div className="flex gap-2 items-center text-xs text-slate-400">
            <span>Date Range:</span>
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
        )}
      </div>

      {/* Primary Data Display */}
      <div className="card-glass border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            <span>Fetching log details...</span>
          </div>
        ) : activeTab === 'directory' ? (
          /* DIRECTORY VIEW */
          customers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              {customers.map((c) => (
                <div key={c.id} className="card relative border border-slate-800/80 bg-slate-900/40 p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-semibold text-slate-100 truncate max-w-[70%]">
                        {c.name}
                      </h4>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          c.outstandingCredit > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {c.outstandingCredit > 0
                          ? `₹${c.outstandingCredit.toLocaleString('en-IN')}`
                          : 'Clear'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-2">
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 mt-0.5" />
                        <span className="line-clamp-2">{c.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/60">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddCredit(c.id)}
                        className="btn btn-secondary btn-sm px-2 text-[11px] font-medium"
                        title="Record medicine credit purchase"
                      >
                        + Credit
                      </button>
                      <button
                        onClick={() => handleAddCollection(c.id)}
                        className="btn btn-secondary btn-sm px-2 text-[11px] font-medium text-emerald-400 hover:text-emerald-350"
                        title="Record payment collected"
                      >
                        Receive
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenLedger(c.id)}
                        className="rounded-lg p-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-350 transition-colors"
                        title="View chronological ledger"
                      >
                        Ledger
                      </button>
                      <button
                        onClick={() => handleEditCustomer(c)}
                        className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                        title="Edit profile"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {isAccessAuthorized && (
                        <button
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-red-400 transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
              <Users className="h-10 w-10 text-slate-650" />
              <h4 className="text-slate-350 font-semibold">No customers registered</h4>
              <p className="text-xs">Add customers to start tracking credits and collections.</p>
            </div>
          )
        ) : activeTab === 'credits' ? (
          /* CREDIT ENTRIES TABLE */
          credits.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Credit Date</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5 text-right">Credit Amount</th>
                  <th className="px-6 py-3.5 text-right">Balance Due</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  {isAccessAuthorized && <th className="px-6 py-3.5 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {credits.map((cr) => {
                  const balanceDue = Number(cr.amount) - Number(cr.paidAmount);
                  const isOverdue = cr.dueDate && new Date(cr.dueDate) < new Date() && cr.status !== 'PAID';
                  return (
                    <tr key={cr.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{cr.customer?.name}</div>
                        {cr.customer?.phone && (
                          <div className="text-[10px] text-slate-500 font-normal">{cr.customer.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        {fmtDate(cr.date)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200 max-w-[200px] truncate">
                        {cr.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cr.dueDate ? (
                          <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-slate-450'}>
                            {fmtDate(cr.dueDate)} {isOverdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span className="text-slate-550">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-100 tabular-nums">
                        {formatCurrency(cr.amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-400 tabular-nums">
                        {formatCurrency(balanceDue)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            cr.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : cr.status === 'PARTIAL'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {cr.status}
                        </span>
                      </td>
                      {isAccessAuthorized && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteCredit(cr.id)}
                            className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-red-450 transition-colors"
                            title="Delete credit entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
              <Receipt className="h-10 w-10 text-slate-650" />
              <h4 className="text-slate-350 font-semibold">No credit entries logged</h4>
              <p className="text-xs">Clear of outstanding credits matching active filters.</p>
            </div>
          )
        ) : (
          /* COLLECTIONS TABLE */
          collections.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Receipt Date</th>
                  <th className="px-6 py-3.5">Payment Mode</th>
                  <th className="px-6 py-3.5">Reference Number</th>
                  <th className="px-6 py-3.5">Allocated Invoice</th>
                  <th className="px-6 py-3.5 text-right">Amount Collected</th>
                  {isAccessAuthorized && <th className="px-6 py-3.5 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {collections.map((co) => (
                  <tr key={co.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {co.customer?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {fmtDate(co.collectionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold uppercase">
                        {co.paymentMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450">
                      {co.referenceNo || <span className="text-slate-550">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic">
                      {co.customerCredit?.description || 'General Credit Balance'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(co.amount)}
                    </td>
                    {isAccessAuthorized && (
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteCollection(co.id)}
                          className="rounded-lg p-1.5 text-slate-455 hover:bg-slate-800 hover:text-red-450 transition-colors"
                          title="Reverse payment collection"
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
              <CreditCard className="h-10 w-10 text-slate-650" />
              <h4 className="text-slate-350 font-semibold">No collections received</h4>
              <p className="text-xs">Record customer payments to decrease their outstanding credit.</p>
            </div>
          )
        )}
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900/20 border border-slate-850 p-4 rounded-xl">
          <span className="text-xs text-slate-450">
            Total {totalRecords} logs found
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span className="text-xs text-slate-300 px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={fetchData}
        customer={editingCustomer}
      />

      {/* Credit Form Modal */}
      <CustomerCreditForm
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onSuccess={fetchData}
        prefillCustomerId={prefillCreditCustomerId}
      />

      {/* Collection Form Modal */}
      <CreditCollectionForm
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSuccess={fetchData}
        prefillCustomerId={prefillCollectionCustomerId}
      />

      {/* Ledger Modal */}
      <CustomerLedger
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        customerId={ledgerCustomerId}
      />
    </div>
  );
}
export default Customers;
