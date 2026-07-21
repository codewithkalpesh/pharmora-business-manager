const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurring.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(authenticate);

// Stats
router.get('/stats', recurringController.getRecurringStats.bind(recurringController));

// CRUD and process trigger
router.get('/', recurringController.getRecurrings.bind(recurringController));
router.get('/:id', recurringController.getRecurringById.bind(recurringController));
router.post('/', requireRole(['OWNER', 'MANAGER']), recurringController.createRecurring.bind(recurringController));
router.put('/:id', requireRole(['OWNER', 'MANAGER']), recurringController.updateRecurring.bind(recurringController));
router.delete('/:id', requireRole(['OWNER']), recurringController.deleteRecurring.bind(recurringController));
router.post('/:id/process', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), recurringController.processManualOccurrence.bind(recurringController));
router.post('/:id/postpone', requireRole(['OWNER', 'MANAGER', 'ACCOUNTANT']), recurringController.postponeReminder.bind(recurringController));

module.exports = router;
