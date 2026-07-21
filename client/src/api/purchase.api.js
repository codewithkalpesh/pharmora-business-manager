// src/api/purchase.api.js
import api from './axios';

export const purchaseApi = {
  // Distributors
  createDistributor: (data) => api.post('/purchases/distributors', data),
  getDistributors: (params) => api.get('/purchases/distributors', { params }),
  updateDistributor: (id, data) => api.put(`/purchases/distributors/${id}`, data),
  deleteDistributor: (id) => api.delete(`/purchases/distributors/${id}`),

  // Bills
  createBill: (data) => api.post('/purchases/bills', data),
  getBills: (params) => api.get('/purchases/bills', { params }),
  updateBill: (id, data) => api.put(`/purchases/bills/${id}`, data),
  deleteBill: (id) => api.delete(`/purchases/bills/${id}`),

  // Stats
  getStats: (params) => api.get('/purchases/stats', { params }),
};
