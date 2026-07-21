// src/api/cashbook.api.js
import api from './axios';

export const cashBookApi = {
  create: (data) => api.post('/cashbook', data),
  getEntries: (params) => api.get('/cashbook', { params }),
  getEntryByDate: (date) => api.get(`/cashbook/date/${date}`),
  update: (id, data) => api.put(`/cashbook/${id}`, data),
  delete: (id) => api.delete(`/cashbook/${id}`),
};
