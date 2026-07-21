import api from './axios';

export const recurringApi = {
  createRecurring: (data) => api.post('/recurring', data),
  getRecurrings: (params) => api.get('/recurring', { params }),
  getRecurringById: (id) => api.get(`/recurring/${id}`),
  updateRecurring: (id, data) => api.put(`/recurring/${id}`, data),
  deleteRecurring: (id) => api.delete(`/recurring/${id}`),
  processManualOccurrence: (id) => api.post(`/recurring/${id}/process`),
  postponeReminder: (id) => api.post(`/recurring/${id}/postpone`),
  getRecurringStats: () => api.get('/recurring/stats'),
};
