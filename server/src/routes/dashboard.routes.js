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

module.exports = router;
