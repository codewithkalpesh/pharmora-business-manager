// src/routes/expense.routes.js
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

// Protect all routes
router.use(authenticate);

// Categories
router.get('/categories', expenseController.getCategories);
router.post('/categories', expenseController.createCategory);

// Stats
router.get('/stats', expenseController.getExpenseStats);

// Expenses CRUD
router.post('/', upload.single('receipt'), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.put('/:id', upload.single('receipt'), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
