// src/api/auth.api.js
import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (data) => api.patch('/auth/change-password', data),
  updateGroupWebhook: (data) => api.patch('/auth/group-webhook', data),
  testGroupWebhook: (data) => api.post('/auth/group-webhook/test', data),
};
