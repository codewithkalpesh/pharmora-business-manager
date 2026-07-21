// src/controllers/payment.controller.js
const paymentService = require('../services/payment.service');
const { createPaymentSchema } = require('../validators/payment.validator');
const ApiError = require('../utils/ApiError');

class PaymentController {
  async createPayment(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.amount !== undefined) body.amount = parseFloat(body.amount);
      const parsed = createPaymentSchema.safeParse(body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const payment = await paymentService.createPayment(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }

  async getPayments(req, res, next) {
    try {
      const result = await paymentService.getPayments(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deletePayment(req, res, next) {
    try {
      const result = await paymentService.deletePayment(req.params.id, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getDistributorLedger(req, res, next) {
    try {
      const result = await paymentService.getDistributorLedger(req.params.distributorId, req.user.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPaymentStats(req, res, next) {
    try {
      const stats = await paymentService.getPaymentStats(req.user.id);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentController();
