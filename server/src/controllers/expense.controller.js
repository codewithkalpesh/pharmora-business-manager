// src/controllers/expense.controller.js
const expenseService = require('../services/expense.service');
const ApiResponse = require('../utils/ApiResponse');
const { createExpenseSchema, createCategorySchema } = require('../validators/expense.validator');

class ExpenseController {
  async createExpense(req, res, next) {
    try {
      createExpenseSchema.parse({
        ...req.body,
        isRecurring: req.body.isRecurring === 'true' || req.body.isRecurring === true,
      });

      const expense = await expenseService.createExpense(req.body, req.file, req.user.id);
      return res.status(201).json(
        new ApiResponse(201, expense, 'Expense recorded successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const data = await expenseService.getExpenses(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, data, 'Expenses retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const expense = await expenseService.updateExpense(id, req.body, req.file, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, expense, 'Expense updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;
      await expenseService.deleteExpense(id, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, null, 'Expense deleted successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await expenseService.getCategories(req.user.id);
      return res.status(200).json(
        new ApiResponse(200, categories, 'Categories retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      createCategorySchema.parse(req.body);
      const category = await expenseService.createCategory(req.body);
      return res.status(201).json(
        new ApiResponse(201, category, 'Expense category created successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getExpenseStats(req, res, next) {
    try {
      const stats = await expenseService.getExpenseStats(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, stats, 'Expense statistics retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
