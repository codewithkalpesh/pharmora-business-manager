import api from './axios';

export const bankApi = {
  // Accounts
  createAccount: (data) => api.post('/banks/accounts', data),
  getAccounts: (params) => api.get('/banks/accounts', { params }),
  updateAccount: (id, data) => api.put(`/banks/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/banks/accounts/${id}`),

  // Transactions
  createTransaction: (data) => api.post('/banks/transactions', data),
  getTransactions: (params) => api.get('/banks/transactions', { params }),
  deleteTransaction: (id) => api.delete(`/banks/transactions/${id}`),

  // Stats
  getBankStats: () => api.get('/banks/stats'),
};
