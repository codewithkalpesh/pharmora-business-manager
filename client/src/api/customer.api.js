import api from './axios';

export const customerApi = {
  // Customers
  createCustomer: (data) => api.post('/customers', data),
  getCustomers: (params) => api.get('/customers', { params }),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),

  // Credits
  createCredit: (data) => api.post('/customers/credits', data),
  getCredits: (params) => api.get('/customers/credits', { params }),
  deleteCredit: (id) => api.delete(`/customers/credits/${id}`),

  // Collections
  createCollection: (data) => api.post('/customers/collections', data),
  getCollections: (params) => api.get('/customers/collections', { params }),
  deleteCollection: (id) => api.delete(`/customers/collections/${id}`),

  // Ledger & Stats
  getCustomerLedger: (customerId) => api.get(`/customers/ledger/${customerId}`),
  getCustomerStats: () => api.get('/customers/stats'),
};
