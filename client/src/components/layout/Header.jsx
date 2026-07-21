// src/components/layout/Header.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getInitials } from '../../lib/utils';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/cash': 'Cash Book',
  '/expenses': 'Expenses',
  '/purchases': 'Purchases',
  '/distributors': 'Distributors',
  '/payments': 'Distributor Payments',
  '/customers': 'Customers',
  '/banks': 'Banks',
  '/recurring': 'Recurring',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export function Header({ collapsed, onToggle, onMobileToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  // Fetch dynamic unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data),
    refetchInterval: 30 * 1000, // poll unread count every 30s
    retry: 1,
  });

  const unreadCount = countData?.count || 0;
  const currentLabel = ROUTE_LABELS[location.pathname] || ROUTE_LABELS[`/${location.pathname.split('/')[1]}`] || 'Dashboard';

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left: toggle + breadcrumb */}
      <div className="header-left">
        <button
          className="header-toggle"
          onClick={() => {
            if (window.innerWidth < 768 && onMobileToggle) {
              onMobileToggle();
            } else if (onToggle) {
              onToggle();
            }
          }}
          title="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="breadcrumb">
          <span className="breadcrumb-item">Pharmora</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{currentLabel}</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="header-right">
        {/* Search toggle */}
        {showSearch ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="input-wrapper" style={{ width: 240 }}>
              <Search size={15} className="input-icon" />
              <input
                className="input"
                placeholder="Search..."
                autoFocus
                style={{ height: 34, paddingLeft: 36 }}
              />
            </div>
            <button className="header-icon-btn" onClick={() => setShowSearch(false)}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button className="header-icon-btn" onClick={() => setShowSearch(true)} title="Search">
            <Search size={16} />
          </button>
        )}

        {/* Notifications */}
        <button
          className="header-icon-btn"
          title="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </button>

        {/* User avatar */}
        <div
          className="user-avatar"
          title={`${user?.name} (${user?.role})`}
          onClick={logout}
        >
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
}
