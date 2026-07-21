// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// All payment routes require authentication
router.use(authenticate);

// Stats summary
router.get('/stats', paymentController.getPaymentStats.bind(paymentController));

// Distributor ledger (full bill + payment history for one distributor)
router.get('/ledger/:distributorId', paymentController.getDistributorLedger.bind(paymentController));

// Payment CRUD
router.get('/', paymentController.getPayments.bind(paymentController));
router.post('/', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), paymentController.createPayment.bind(paymentController));
router.delete('/:id', requireRole(['OWNER', 'MANAGER']), paymentController.deletePayment.bind(paymentController));

module.exports = router;
