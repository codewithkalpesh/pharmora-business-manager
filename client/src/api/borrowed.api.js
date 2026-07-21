// src/api/borrowed.api.js
import api from './axios';

export const borrowedApi = {
  getBorrowedList: (params) => api.get('/borrowed', { params }),
  getBorrowedById: (id) => api.get(`/borrowed/${id}`),
  createBorrowed: (data) => api.post('/borrowed', data),
  updateBorrowed: (id, data) => api.put(`/borrowed/${id}`, data),
  deleteBorrowed: (id) => api.delete(`/borrowed/${id}`),

  // Repayments
  addRepayment: (id, data) => api.post(`/borrowed/${id}/repay`, data),
  deleteRepayment: (repaymentId) => api.delete(`/borrowed/repayments/${repaymentId}`),
};
