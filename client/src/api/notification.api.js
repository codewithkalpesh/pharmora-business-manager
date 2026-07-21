// src/api/notification.api.js
import api from './axios';

export const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  generateReminders: () => api.post('/notifications/generate-reminders'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  dismiss: (id) => api.patch(`/notifications/${id}/dismiss`),
  delete: (id) => api.delete(`/notifications/${id}`),
};
