// src/api/analytics.api.js
import api from './axios';

export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getRevenueVsExpenses: (params) => api.get('/analytics/revenue-vs-expenses', { params }),
  getExpenseBreakdown: (params) => api.get('/analytics/expense-breakdown', { params }),
  getPaymentModes: (params) => api.get('/analytics/payment-modes', { params }),
  getTopDistributors: (params) => api.get('/analytics/top-distributors', { params }),
  getBankSummary: () => api.get('/analytics/bank-summary'),
  getCustomerCredit: () => api.get('/analytics/customer-credit'),
};
