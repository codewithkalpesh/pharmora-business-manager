// src/routes/cashbook.routes.js
const express = require('express');
const router = express.Router();
const cashBookController = require('../controllers/cashbook.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Protect all routes
router.use(authenticate);

router.post('/', cashBookController.createEntry);
router.get('/', cashBookController.getEntries);
router.get('/date/:date', cashBookController.getEntryByDate);
router.put('/:id', cashBookController.updateEntry);
router.delete('/:id', cashBookController.deleteEntry);

module.exports = router;
