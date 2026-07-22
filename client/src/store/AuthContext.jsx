// src/store/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('pbm_access_token');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await authApi.getProfile();
      setUser(data.data?.user || null);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('pbm_access_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    const { user: u, accessToken, refreshToken } = data.data;
    localStorage.setItem('pbm_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('pbm_refresh_token', refreshToken);
    }
    setUser(u);
    setIsAuthenticated(true);
    return u;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('pbm_access_token');
      localStorage.removeItem('pbm_refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    const { data } = await authApi.register(userData);
    return data.data?.user;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, register, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
