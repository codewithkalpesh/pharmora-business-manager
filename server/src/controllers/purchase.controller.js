// src/controllers/purchase.controller.js
const purchaseService = require('../services/purchase.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { 
  createDistributorSchema, 
  updateDistributorSchema, 
  createBillSchema, 
  updateBillSchema 
} = require('../validators/purchase.validator');

class PurchaseController {
  // Distributors
  async createDistributor(req, res, next) {
    try {
      const parsed = createDistributorSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const distributor = await purchaseService.createDistributor(parsed.data, req.user.id);
      return res.status(201).json(
        new ApiResponse(201, distributor, 'Distributor profile created successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getDistributors(req, res, next) {
    try {
      const data = await purchaseService.getDistributors(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, data, 'Distributors retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateDistributor(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = updateDistributorSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const distributor = await purchaseService.updateDistributor(id, parsed.data, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, distributor, 'Distributor profile updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteDistributor(req, res, next) {
    try {
      const { id } = req.params;
      await purchaseService.deleteDistributor(id, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, null, 'Distributor profile deleted successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  // Purchase Bills
  async createBill(req, res, next) {
    try {
      const parsed = createBillSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const bill = await purchaseService.createBill(parsed.data, req.user.id);
      return res.status(201).json(
        new ApiResponse(201, bill, 'Purchase invoice recorded successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async getBills(req, res, next) {
    try {
      const data = await purchaseService.getBills(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, data, 'Purchase invoices retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateBill(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = updateBillSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const bill = await purchaseService.updateBill(id, parsed.data, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, bill, 'Purchase invoice updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteBill(req, res, next) {
    try {
      const { id } = req.params;
      await purchaseService.deleteBill(id, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, null, 'Purchase invoice deleted successfully.')
      );
    } catch (error) {
      next(error);
    }
  }

  // Analytics
  async getPurchaseStats(req, res, next) {
    try {
      const stats = await purchaseService.getPurchaseStats(req.query, req.user.id);
      return res.status(200).json(
        new ApiResponse(200, stats, 'Purchase stats retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PurchaseController();
