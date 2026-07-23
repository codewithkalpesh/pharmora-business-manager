// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Receipt, ShoppingCart, Truck,
  CreditCard, Users, Building2, RefreshCw, BarChart3, TrendingUp,
  Bell, Settings, Pill, ChevronLeft, ChevronRight, LogOut, X, HandCoins,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getInitials } from '../../lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Cash Book',      icon: BookOpen,        to: '/cash',         badge: null },
  { label: 'Expenses',       icon: Receipt,         to: '/expenses' },
  { label: 'Purchases',      icon: ShoppingCart,    to: '/purchases' },
  { label: 'Distributors',   icon: Truck,           to: '/distributors' },
  { label: 'Payments',       icon: CreditCard,      to: '/payments' },
  { label: 'Customers',      icon: Users,           to: '/customers' },
  { label: 'Borrowed Money', icon: HandCoins,       to: '/borrowed' },
  { label: 'Banks',          icon: Building2,       to: '/banks' },
  { label: 'Recurring',      icon: RefreshCw,       to: '/recurring' },
  { label: 'Reports',        icon: BarChart3,       to: '/reports' },
  { label: 'Analytics',      icon: TrendingUp,      to: '/analytics' },
  { label: 'Notifications',  icon: Bell,            to: '/notifications' },
  { label: 'Settings',       icon: Settings,        to: '/settings' },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon">
            <Pill size={20} color="white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div style={{ overflow: 'hidden' }}>
              <div className="sidebar-logo-text">
                <span>Pharmo</span>ra
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
                Business Manager
              </div>
            </div>
          )}
        </div>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="btn-ghost"
            style={{ padding: 4, borderRadius: 6, color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-section-label">Main Menu</div>
        )}

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={collapsed && !mobileOpen ? item.label : undefined}
          >
            <span className="sidebar-item-icon">
              <item.icon size={18} />
            </span>
            {(!collapsed || mobileOpen) && (
              <span className="sidebar-item-label">{item.label}</span>
            )}
            {(!collapsed || mobileOpen) && item.badge && (
              <span className="sidebar-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: collapse toggle + user */}
      <div className="sidebar-footer">
        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={onToggle}
          className="sidebar-item btn-ghost desktop-only"
          style={{ width: '100%', marginBottom: 8, border: '1px solid var(--border-subtle)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar-item-icon">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </span>
          {!collapsed && <span className="sidebar-item-label">Collapse</span>}
        </button>

        {/* User info */}
        <div
          className="sidebar-item"
          style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4, cursor: 'default' }}
        >
          <div
            className="user-avatar"
            style={{ width: 30, height: 30, fontSize: '0.6875rem', flexShrink: 0 }}
          >
            {getInitials(user?.name)}
          </div>
          {(!collapsed || mobileOpen) && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name}
              </div>
              <div className="truncate" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {user?.role}
              </div>
            </div>
          )}
          {(!collapsed || mobileOpen) && (
            <button
              onClick={logout}
              className="sidebar-item-icon btn-ghost"
              style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 4, borderRadius: 'var(--radius-sm)' }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
