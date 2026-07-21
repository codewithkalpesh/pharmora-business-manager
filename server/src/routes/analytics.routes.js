// src/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/summary', analyticsController.getSummary);
router.get('/revenue-vs-expenses', analyticsController.getRevenueVsExpenseTrend);
router.get('/expense-breakdown', analyticsController.getExpenseBreakdown);
router.get('/payment-modes', analyticsController.getPaymentModeDistribution);
router.get('/top-distributors', analyticsController.getTopDistributors);
router.get('/bank-summary', analyticsController.getBankSummary);
router.get('/customer-credit', analyticsController.getCustomerCreditSummary);

module.exports = router;
