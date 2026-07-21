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
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile backdrop overlay */}
      <div
        className={`mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={closeMobile}
      />

      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
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
