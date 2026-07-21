// src/api/payment.api.js
import api from './axios';

// ─── Distributor Payments ───────────────────────────────────────────────────

export const getPayments = (params = {}) =>
  api.get('/payments', { params }).then((r) => r.data);

export const createPayment = (data) =>
  api.post('/payments', data).then((r) => r.data);

export const deletePayment = (id) =>
  api.delete(`/payments/${id}`).then((r) => r.data);

// ─── Ledger & Stats ─────────────────────────────────────────────────────────

export const getDistributorLedger = (distributorId) =>
  api.get(`/payments/ledger/${distributorId}`).then((r) => r.data);

export const getPaymentStats = () =>
  api.get('/payments/stats').then((r) => r.data);
