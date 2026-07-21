const bankService = require('../services/bank.service');
const { bankAccountSchema, bankTransactionSchema } = require('../validators/bank.validator');
const ApiError = require('../utils/ApiError');

class BankController {
  // ─── Account Controllers ────────────────────────────────────────────────────

  async createAccount(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.openingBalance !== undefined) body.openingBalance = parseFloat(body.openingBalance);

      const parsed = bankAccountSchema.safeParse(body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const account = await bankService.createAccount(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  async getAccounts(req, res, next) {
    try {
      const result = await bankService.getAccounts(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async updateAccount(req, res, next) {
    try {
      const parsed = bankAccountSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const account = await bankService.updateAccount(req.params.id, parsed.data);
      return res.json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      await bankService.deleteAccount(req.params.id);
      return res.json({ success: true, message: 'Bank account deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Transaction Controllers ────────────────────────────────────────────────

  async createTransaction(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.amount !== undefined) body.amount = parseFloat(body.amount);

      const parsed = bankTransactionSchema.safeParse(body);
      if (!parsed.success) {
        return next(new ApiError(422, 'Validation failed', parsed.error.flatten().fieldErrors));
      }
      const txn = await bankService.createTransaction(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: txn });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const result = await bankService.getTransactions(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteTransaction(req, res, next) {
    try {
      const result = await bankService.deleteTransaction(req.params.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getBankStats(req, res, next) {
    try {
      const stats = await bankService.getBankStats(req.user.id);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BankController();
