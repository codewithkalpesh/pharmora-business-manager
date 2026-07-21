const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// All customer/credit/collection operations require authentication
router.use(authenticate);

// Stats & Ledger
router.get('/stats', customerController.getCustomerStats.bind(customerController));
router.get('/ledger/:customerId', customerController.getCustomerLedger.bind(customerController));

// Customer CRUD
router.get('/', customerController.getCustomers.bind(customerController));
router.post('/', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), customerController.createCustomer.bind(customerController));
router.put('/:id', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), customerController.updateCustomer.bind(customerController));
router.delete('/:id', requireRole(['OWNER', 'MANAGER']), customerController.deleteCustomer.bind(customerController));

// Credit CRUD
router.get('/credits', customerController.getCredits.bind(customerController));
router.post('/credits', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), customerController.createCredit.bind(customerController));
router.delete('/credits/:id', requireRole(['OWNER', 'MANAGER']), customerController.deleteCredit.bind(customerController));

// Collection CRUD
router.get('/collections', customerController.getCollections.bind(customerController));
router.post('/collections', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), customerController.createCollection.bind(customerController));
router.delete('/collections/:id', requireRole(['OWNER', 'MANAGER']), customerController.deleteCollection.bind(customerController));

module.exports = router;
