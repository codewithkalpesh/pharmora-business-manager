// src/api/report.api.js
import api from './axios';

export const reportApi = {
  generateMonthlyReport: (data) => api.post('/reports/generate-monthly', data),
};
