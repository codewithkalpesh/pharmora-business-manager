// src/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate); // all dashboard routes require auth

router.get('/kpis', dashboardController.getKPIs);
router.get('/sales-trend', dashboardController.getSalesTrend);
router.get('/expense-trend', dashboardController.getExpenseTrend);
router.get('/expense-by-category', dashboardController.getExpenseByCategory);

router.get('/expenses/history', dashboardController.getExpenseHistory);
router.get('/cash/history', dashboardController.getCashHistory);
router.get('/bank/history', dashboardController.getBankHistory);
router.get('/revenue/history', dashboardController.getRevenueHistory);

module.exports = router;
