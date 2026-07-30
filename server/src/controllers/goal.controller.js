const goalService = require('../services/goal.service');
const { createGoalSchema, updateGoalSchema, addContributionSchema } = require('../validators/goal.validator');
const ApiError = require('../utils/ApiError');

class GoalController {
  async createGoal(req, res, next) {
    try {
      const validated = createGoalSchema.parse(req.body);
      const result = await goalService.createGoal(validated, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Payment goal created successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getGoals(req, res, next) {
    try {
      const result = await goalService.getGoals(req.query, req.user.id);
      return res.json({
        success: true,
        data: result.goals,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getGoalById(req, res, next) {
    try {
      const goal = await goalService.getGoalById(req.params.id, req.user.id);
      return res.json({
        success: true,
        data: goal,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateGoal(req, res, next) {
    try {
      const validated = updateGoalSchema.parse(req.body);
      const goal = await goalService.updateGoal(req.params.id, validated, req.user.id);
      return res.json({
        success: true,
        message: 'Payment goal updated successfully.',
        data: goal,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteGoal(req, res, next) {
    try {
      await goalService.deleteGoal(req.params.id, req.user.id);
      return res.json({
        success: true,
        message: 'Payment goal deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  async addContribution(req, res, next) {
    try {
      const validated = addContributionSchema.parse(req.body);
      const result = await goalService.addContribution(req.params.id, validated, req.user.id);
      return res.json({
        success: true,
        message: 'Funds added to goal successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSyncData(req, res, next) {
    try {
      const syncData = await goalService.getSyncData(req.user.id);
      return res.json({
        success: true,
        data: syncData,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDailyAlertGoals(req, res, next) {
    try {
      const goals = await goalService.getDailyAlertGoals(req.user.id);
      return res.json({
        success: true,
        data: goals,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GoalController();
