// src/components/layout/AppShell.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => setCollapsed((v) => !v);
  const toggleMobile = () => setMobileOpen((v) => !v);

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 'calc(var(--z-sidebar) - 1)', display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
      />

      <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          collapsed={collapsed}
          onToggle={toggle}
          onMobileToggle={toggleMobile}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
