// src/api/dashboard.api.js
import api from './axios';

export const dashboardApi = {
  getKPIs: (params) => api.get('/dashboard/kpis', { params }),
  getSalesTrend: () => api.get('/dashboard/sales-trend'),
  getExpenseTrend: () => api.get('/dashboard/expense-trend'),
  getExpenseByCategory: () => api.get('/dashboard/expense-by-category'),
};
