// src/controllers/borrowed.controller.js
const borrowedService = require('../services/borrowed.service');
const ApiResponse = require('../utils/ApiResponse');

class BorrowedController {
  async createBorrowed(req, res, next) {
    try {
      const item = await borrowedService.createBorrowed(req.body, req.user.id);
      return res.status(201).json(
        new ApiResponse(201, item, 'Borrowed money record created successfully.')
      );
    } catch (err) {
      next(err);
    }
  }

  async getBorrowedList(req, res, next) {
    try {
      const result = await borrowedService.getBorrowedList(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, result, 'Borrowed money records retrieved successfully.')
      );
    } catch (err) {
      next(err);
    }
  }

  async getBorrowedById(req, res, next) {
    try {
      const item = await borrowedService.getBorrowedById(req.params.id, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, item, 'Borrowed record retrieved.')
      );
    } catch (err) {
      next(err);
    }
  }

  async updateBorrowed(req, res, next) {
    try {
      const updated = await borrowedService.updateBorrowed(req.params.id, req.body, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, updated, 'Borrowed money record updated.')
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteBorrowed(req, res, next) {
    try {
      await borrowedService.deleteBorrowed(req.params.id, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, null, 'Borrowed money record deleted.')
      );
    } catch (err) {
      next(err);
    }
  }

  async addRepayment(req, res, next) {
    try {
      const repayment = await borrowedService.addRepayment(req.params.id, req.body, req.user.id);
      return res.status(201).json(
        new ApiResponse(201, repayment, 'Repayment recorded successfully.')
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteRepayment(req, res, next) {
    try {
      const result = await borrowedService.deleteRepayment(req.params.repaymentId, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, result, 'Repayment deleted successfully.')
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BorrowedController();
