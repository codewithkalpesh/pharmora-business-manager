// src/controllers/cashbook.controller.js
const cashBookService = require('../services/cashbook.service');
const ApiResponse = require('../utils/ApiResponse');

class CashBookController {
  async createEntry(req, res, next) {
    try {
      const entry = await cashBookService.createEntry(req.body, req.user.id);
      return res.status(201).json(
        new ApiResponse(201, entry, 'Cash book entry created successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getEntries(req, res, next) {
    try {
      const data = await cashBookService.getEntries(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, data, 'Cash book entries retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getEntryByDate(req, res, next) {
    try {
      const { date } = req.params;
      const data = await cashBookService.getEntryByDate(date, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, data, 'Cash book entry retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateEntry(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await cashBookService.updateEntry(id, req.body, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, entry, 'Cash book entry updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteEntry(req, res, next) {
    try {
      const { id } = req.params;
      await cashBookService.deleteEntry(id, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, null, 'Cash book entry deleted successfully.')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CashBookController();
