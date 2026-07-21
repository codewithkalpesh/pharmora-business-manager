// src/router/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { CashBook } from '../pages/cashbook/CashBook';
import { Expenses } from '../pages/expenses/Expenses';
import { Purchases } from '../pages/purchases/Purchases';
import { Distributors } from '../pages/purchases/Distributors';
import { Payments } from '../pages/payments/Payments';
import { BorrowedMoney } from '../pages/borrowed/BorrowedMoney';
import { Banks } from '../pages/banks/Banks';
import { Recurring } from '../pages/recurring/Recurring';
import { Reports } from '../pages/reports/Reports';
import { Analytics } from '../pages/analytics/Analytics';
import { Notifications } from '../pages/notifications/Notifications';
import { Settings } from '../pages/settings/Settings';
import { NotFound } from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'cash', element: <CashBook /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'purchases', element: <Purchases /> },
      { path: 'distributors', element: <Distributors /> },
      { path: 'payments', element: <Payments /> },
      { path: 'borrowed', element: <BorrowedMoney /> },
      { path: 'banks', element: <Banks /> },
      { path: 'recurring', element: <Recurring /> },
      { path: 'reports', element: <Reports /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
