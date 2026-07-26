// src/controllers/dashboard.controller.js
const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');

const getKPIs = async (req, res, next) => {
  try {
    const data = await dashboardService.getKPIs(req.user.id, req.query.date);
    return res.status(200).json(new ApiResponse(200, data, 'Dashboard KPIs loaded.'));
  } catch (err) {
    next(err);
  }
};

const getSalesTrend = async (req, res, next) => {
  try {
    const data = await dashboardService.getSalesTrend(req.user.id);
    return res.status(200).json(new ApiResponse(200, data));
  } catch (err) {
    next(err);
  }
};

const getExpenseTrend = async (req, res, next) => {
  try {
    const data = await dashboardService.getExpenseTrend(req.user.id);
    return res.status(200).json(new ApiResponse(200, data));
  } catch (err) {
    next(err);
  }
};

const getExpenseByCategory = async (req, res, next) => {
  try {
    const data = await dashboardService.getExpenseByCategory(req.user.id);
    return res.status(200).json(new ApiResponse(200, data));
  } catch (err) {
    next(err);
  }
};

const getExpenseHistory = async (req, res, next) => {
  try {
    const data = await dashboardService.getExpenseHistory(req.user.id, req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const getCashHistory = async (req, res, next) => {
  try {
    const data = await dashboardService.getCashHistory(req.user.id, req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const getBankHistory = async (req, res, next) => {
  try {
    const data = await dashboardService.getBankHistory(req.user.id, req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const getRevenueHistory = async (req, res, next) => {
  try {
    const data = await dashboardService.getRevenueHistory(req.user.id, req.query);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getKPIs,
  getSalesTrend,
  getExpenseTrend,
  getExpenseByCategory,
  getExpenseHistory,
  getCashHistory,
  getBankHistory,
  getRevenueHistory,
};

