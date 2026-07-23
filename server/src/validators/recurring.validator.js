const { z } = require('zod');

const recurringTransactionSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().max(500).nullable().optional()
    ),
    amount: z.preprocess(
      (val) => {
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      },
      z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive')
    ),
    type: z.enum(['INCOME', 'EXPENSE']),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM']),
    action: z.enum(['REMINDER_ONLY', 'AUTO_DRAFT']).optional().default('REMINDER_ONLY'),
    paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER']).optional().default('CASH'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.preprocess(
      (val) => (val === '' || val === undefined || val === 'null' ? null : val),
      z.string().nullable().optional()
    ),
    customDays: z.preprocess(
      (val) => {
        if (val === null || val === undefined || val === '' || val === 'null' || val === 'undefined') return null;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
      },
      z.number().int().positive('Custom days must be positive').nullable().optional()
    ),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.frequency === 'CUSTOM' && (!data.customDays || data.customDays <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Custom days is required and must be positive when frequency is CUSTOM',
      path: ['customDays'],
    }
  );

module.exports = {
  recurringTransactionSchema,
};
