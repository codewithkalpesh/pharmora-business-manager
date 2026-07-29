const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.post('/generate-monthly', reportController.generateMonthlyReport);

module.exports = router;