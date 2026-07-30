const { z } = require('zod');

const decimal = z.preprocess(
  (val) => (typeof val === 'string' ? parseFloat(val) : val),
  z.number().positive('Target amount must be greater than zero')
);

const createGoalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  description: z.string().max(500).optional().nullable(),
  category: z.enum(['PURCHASE', 'EXPENSE', 'BORROWED_MONEY', 'GENERAL']).default('GENERAL'),
  targetAmount: decimal,
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  distributorId: z.string().optional().nullable(),
  billId: z.string().optional().nullable(),
  expenseCategoryId: z.string().optional().nullable(),
  borrowedMoneyId: z.string().optional().nullable(),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

const addContributionSchema = z.object({
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive('Contribution amount must be greater than zero')
  ),
  notes: z.string().max(300).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
  addContributionSchema,
};
