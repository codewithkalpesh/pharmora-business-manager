// src/routes/purchase.routes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Protect all routes
router.use(authenticate);

// Stats
router.get('/stats', purchaseController.getPurchaseStats);

// Distributors CRUD
router.post('/distributors', purchaseController.createDistributor);
router.get('/distributors', purchaseController.getDistributors);
router.put('/distributors/:id', purchaseController.updateDistributor);
router.delete('/distributors/:id', purchaseController.deleteDistributor);

// Purchase Bills CRUD
router.post('/bills', purchaseController.createBill);
router.get('/bills', purchaseController.getBills);
router.put('/bills/:id', purchaseController.updateBill);
router.delete('/bills/:id', purchaseController.deleteBill);

module.exports = router;
