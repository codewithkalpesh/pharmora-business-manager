const recurringService = require('../services/recurring.service');
const { recurringTransactionSchema } = require('../validators/recurring.validator');
const ApiError = require('../utils/ApiError');

class RecurringController {
  async createRecurring(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.amount !== undefined && body.amount !== '') body.amount = parseFloat(body.amount);
      if (body.customDays !== undefined && body.customDays !== '') {
        body.customDays = parseInt(body.customDays, 10);
      } else {
        body.customDays = null;
      }
      if (body.isActive !== undefined) {
        body.isActive = body.isActive === true || body.isActive === 'true';
      }

      const parsed = recurringTransactionSchema.safeParse(body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const firstField = Object.keys(fieldErrors)[0];
        const firstErrMsg = firstField ? `${firstField}: ${fieldErrors[firstField][0]}` : 'Validation failed';
        return next(new ApiError(422, firstErrMsg, fieldErrors));
      }

      const schedule = await recurringService.createRecurring(parsed.data, req.user.id);
      return res.status(201).json({ success: true, data: schedule });
    } catch (err) {
      next(err);
    }
  }

  async getRecurrings(req, res, next) {
    try {
      const result = await recurringService.getRecurrings(req.query, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getRecurringById(req, res, next) {
    try {
      const item = await recurringService.getRecurringById(req.params.id, req.user.id);
      return res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateRecurring(req, res, next) {
    try {
      const body = { ...req.body };
      if (body.amount !== undefined && body.amount !== '') body.amount = parseFloat(body.amount);
      if (body.customDays !== undefined && body.customDays !== '') {
        body.customDays = parseInt(body.customDays, 10);
      } else if (body.customDays === '') {
        body.customDays = null;
      }
      if (body.isActive !== undefined) {
        body.isActive = body.isActive === true || body.isActive === 'true';
      }

      const parsed = recurringTransactionSchema.partial().safeParse(body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const firstField = Object.keys(fieldErrors)[0];
        const firstErrMsg = firstField ? `${firstField}: ${fieldErrors[firstField][0]}` : 'Validation failed';
        return next(new ApiError(422, firstErrMsg, fieldErrors));
      }

      const updated = await recurringService.updateRecurring(req.params.id, parsed.data, req.user.id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteRecurring(req, res, next) {
    try {
      await recurringService.deleteRecurring(req.params.id, req.user.id);
      return res.json({ success: true, message: 'Recurring schedule deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async processManualOccurrence(req, res, next) {
    try {
      const result = await recurringService.processManualOccurrence(req.params.id, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async postponeReminder(req, res, next) {
    try {
      const result = await recurringService.postponeReminder(req.params.id, req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getRecurringStats(req, res, next) {
    try {
      const stats = await recurringService.getRecurringStats(req.user.id);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecurringController();
