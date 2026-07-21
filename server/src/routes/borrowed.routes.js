// src/routes/borrowed.routes.js
const express = require('express');
const router = express.Router();
const borrowedController = require('../controllers/borrowed.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/', borrowedController.createBorrowed);
router.get('/', borrowedController.getBorrowedList);
router.get('/:id', borrowedController.getBorrowedById);
router.put('/:id', borrowedController.updateBorrowed);
router.delete('/:id', borrowedController.deleteBorrowed);

// Repayments
router.post('/:id/repay', borrowedController.addRepayment);
router.delete('/repayments/:repaymentId', borrowedController.deleteRepayment);

module.exports = router;
