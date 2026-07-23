const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bank.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(authenticate);

// Stats
router.get('/stats', bankController.getBankStats.bind(bankController));

// Account CRUD
router.get('/accounts', bankController.getAccounts.bind(bankController));
router.post('/accounts', requireRole(['OWNER', 'MANAGER']), bankController.createAccount.bind(bankController));
router.put('/accounts/:id', requireRole(['OWNER', 'MANAGER']), bankController.updateAccount.bind(bankController));
router.patch('/accounts/:id/primary', requireRole(['OWNER', 'MANAGER']), bankController.setPrimaryAccount.bind(bankController));
router.delete('/accounts/:id', requireRole(['OWNER']), bankController.deleteAccount.bind(bankController));

// Transaction CRUD
router.get('/transactions', bankController.getTransactions.bind(bankController));
router.post('/transactions', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), bankController.createTransaction.bind(bankController));
router.delete('/transactions/:id', requireRole(['OWNER', 'MANAGER']), bankController.deleteTransaction.bind(bankController));

module.exports = router;
