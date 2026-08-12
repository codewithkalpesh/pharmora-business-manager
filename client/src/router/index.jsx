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
import { Customers } from '../pages/customers/Customers';
import { BorrowedMoney } from '../pages/borrowed/BorrowedMoney';
import { Banks } from '../pages/banks/Banks';
import { Recurring } from '../pages/recurring/Recurring';
import { Reports } from '../pages/reports/Reports';
import { Analytics } from '../pages/analytics/Analytics';
import { Notifications } from '../pages/notifications/Notifications';
import { Settings } from '../pages/settings/Settings';
import Goals from '../pages/goals/Goals';
import { ExpenseHistory } from '../pages/history/ExpenseHistory';
import { CashHistory } from '../pages/history/CashHistory';
import { BankHistory } from '../pages/history/BankHistory';
import { RevenueHistory } from '../pages/history/RevenueHistory';
import LandingPage from '../pages/home/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
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
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'dashboard/expenses/history', element: <ExpenseHistory /> },
      { path: 'dashboard/expenses/today', element: <ExpenseHistory /> },
      { path: 'dashboard/cash/history', element: <CashHistory /> },
      { path: 'dashboard/bank/history', element: <BankHistory /> },
      { path: 'dashboard/revenue/history', element: <RevenueHistory /> },
      { path: 'cash', element: <CashBook /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'purchases', element: <Purchases /> },
      { path: 'distributors', element: <Distributors /> },
      { path: 'payments', element: <Payments /> },
      { path: 'borrowed', element: <BorrowedMoney /> },
      { path: 'goals', element: <Goals /> },
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
