// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send httpOnly cookies
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach accessToken from memory if available ──────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pbm_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 → refresh token ─────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      const url = original?.url || '';
      const isAuthEndpoint =
        url.includes('/auth/refresh') ||
        url.includes('/auth/login') ||
        url.includes('/auth/register');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If checking /auth/me without an access token, don't trigger refresh loop
      if (url.includes('/auth/me') && !localStorage.getItem('pbm_access_token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('pbm_refresh_token');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );
        const newToken = data.data?.accessToken;
        const newRefreshToken = data.data?.refreshToken;
        localStorage.setItem('pbm_access_token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('pbm_refresh_token', newRefreshToken);
        }
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('pbm_access_token');
        localStorage.removeItem('pbm_refresh_token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
