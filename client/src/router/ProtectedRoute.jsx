// src/router/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-page" style={{ flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p className="loading-status-text">Connecting to secure database... (may take a moment on first launch)</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-page" style={{ flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p className="loading-status-text">Connecting to secure database... (may take a moment on first launch)</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
