const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/sync-data', (req, res, next) => goalController.getSyncData(req, res, next));
router.get('/daily-alerts', (req, res, next) => goalController.getDailyAlertGoals(req, res, next));

router.get('/', (req, res, next) => goalController.getGoals(req, res, next));
router.post('/', (req, res, next) => goalController.createGoal(req, res, next));

router.get('/:id', (req, res, next) => goalController.getGoalById(req, res, next));
router.put('/:id', (req, res, next) => goalController.updateGoal(req, res, next));
router.delete('/:id', (req, res, next) => goalController.deleteGoal(req, res, next));

router.post('/:id/contribute', (req, res, next) => goalController.addContribution(req, res, next));

module.exports = router;
