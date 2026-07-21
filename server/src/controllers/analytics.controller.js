// src/controllers/analytics.controller.js
const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/ApiResponse');

class AnalyticsController {
  async getSummary(req, res, next) {
    try {
      const data = await analyticsService.getAnalyticsSummary(req.user.id);
      return res.status(200).json(new ApiResponse(200, data, 'Analytics summary retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getRevenueVsExpenseTrend(req, res, next) {
    try {
      const months = parseInt(req.query.months, 10) || 6;
      const data = await analyticsService.getRevenueVsExpenseTrend(req.user.id, months);
      return res.status(200).json(new ApiResponse(200, data, 'Revenue vs expense trend retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getExpenseBreakdown(req, res, next) {
    try {
      const months = parseInt(req.query.months, 10) || 6;
      const data = await analyticsService.getExpenseBreakdownByCategory(req.user.id, months);
      return res.status(200).json(new ApiResponse(200, data, 'Expense breakdown retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getPaymentModeDistribution(req, res, next) {
    try {
      const months = parseInt(req.query.months, 10) || 3;
      const data = await analyticsService.getPaymentModeDistribution(req.user.id, months);
      return res.status(200).json(new ApiResponse(200, data, 'Payment mode distribution retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getTopDistributors(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const data = await analyticsService.getTopDistributors(req.user.id, limit);
      return res.status(200).json(new ApiResponse(200, data, 'Top distributors retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getBankSummary(req, res, next) {
    try {
      const data = await analyticsService.getBankBalanceSummary(req.user.id);
      return res.status(200).json(new ApiResponse(200, data, 'Bank balance summary retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async getCustomerCreditSummary(req, res, next) {
    try {
      const data = await analyticsService.getCustomerCreditSummary(req.user.id);
      return res.status(200).json(new ApiResponse(200, data, 'Customer credit summary retrieved.'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
