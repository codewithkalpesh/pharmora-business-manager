// src/api/expense.api.js
import api from './axios';

export const expenseApi = {
  create: (formData) => api.post('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getExpenses: (params) => api.get('/expenses', { params }),
  update: (id, formData) => api.put(`/expenses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories'),
  createCategory: (data) => api.post('/expenses/categories', data),
  getStats: (params) => api.get('/expenses/stats', { params }),
};
