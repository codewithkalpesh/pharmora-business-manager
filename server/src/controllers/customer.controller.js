const customerService = require('../services/customer.service');
const { 
  customerSchema, 
  customerCreditSchema, 
  creditCollectionSchema 
} = require('../validators/customer.validator');
const ApiError = require('../utils/ApiError');

class CustomerController {
  // ─── Customer Controller Methods ───────────────────────────────────────────

  async createCustomer(req, res, next) {
    try {
      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const customer = await customerService.createCustomer(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  async getCustomers(req, res, next) {
    try {
      const result = await customerService.getCustomers(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const parsed = customerSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const customer = await customerService.updateCustomer(req.params.id, parsed.data, req.user.id);
      return res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      await customerService.deleteCustomer(req.params.id, req.user.id);
      return res.json({ success: true, message: 'Customer deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Credit Controller Methods ──────────────────────────────────────────────

  async createCredit(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.amount !== undefined) body.amount = parseFloat(body.amount);
      
      const parsed = customerCreditSchema.safeParse(body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const credit = await customerService.createCredit(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: credit });
    } catch (err) {
      next(err);
    }
  }

  async getCredits(req, res, next) {
    try {
      const result = await customerService.getCredits(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteCredit(req, res, next) {
    try {
      await customerService.deleteCredit(req.params.id, req.user.id);
      return res.json({ success: true, message: 'Credit entry deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Collection Controller Methods ──────────────────────────────────────────

  async createCollection(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.amount !== undefined) body.amount = parseFloat(body.amount);

      const parsed = creditCollectionSchema.safeParse(body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const collection = await customerService.createCollection(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: collection });
    } catch (err) {
      next(err);
    }
  }

  async getCollections(req, res, next) {
    try {
      const result = await customerService.getCollections(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteCollection(req, res, next) {
    try {
      const result = await customerService.deleteCollection(req.params.id, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ─── Ledger & Stats Controller Methods ──────────────────────────────────────

  async getCustomerLedger(req, res, next) {
    try {
      const ledger = await customerService.getCustomerLedger(req.params.customerId, req.user.id);
      return res.json({ success: true, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerStats(req, res, next) {
    try {
      const stats = await customerService.getCustomerStats(req.user.id);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CustomerController();
