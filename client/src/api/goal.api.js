import axiosInstance from './axios';

export const goalApi = {
  getGoals: (params) => axiosInstance.get('/goals', { params }),
  getGoalById: (id) => axiosInstance.get(`/goals/${id}`),
  createGoal: (data) => axiosInstance.post('/goals', data),
  updateGoal: (id, data) => axiosInstance.put(`/goals/${id}`, data),
  deleteGoal: (id) => axiosInstance.delete(`/goals/${id}`),
  addContribution: (id, data) => axiosInstance.post(`/goals/${id}/contribute`, data),
  getSyncData: () => axiosInstance.get('/goals/sync-data'),
  getDailyAlerts: () => axiosInstance.get('/goals/daily-alerts'),
};
