// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const cashBookRoutes = require('./cashbook.routes');
const expenseRoutes = require('./expense.routes');
const purchaseRoutes = require('./purchase.routes');
const paymentRoutes = require('./payment.routes');
const customerRoutes = require('./customer.routes');
const bankRoutes = require('./bank.routes');
const recurringRoutes = require('./recurring.routes');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const borrowedRoutes = require('./borrowed.routes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cashbook', cashBookRoutes);
router.use('/expenses', expenseRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/payments', paymentRoutes);
router.use('/customers', customerRoutes);
router.use('/banks', bankRoutes);
router.use('/recurring', recurringRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/borrowed', borrowedRoutes);

module.exports = router;
