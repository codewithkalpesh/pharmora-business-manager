// src/validators/expense.validator.js
const { z } = require('zod');

const paymentModeEnum = z.enum(['CASH', 'UPI', 'BOTH', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER']);

const decimal = z.preprocess((val) => (typeof val === 'string' ? parseFloat(val) : val), z.number().positive('Amount must be greater than zero'));

const createExpenseSchema = z.object({
  date: z.coerce.date(),
  categoryId: z.string().nonempty('Category is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: decimal,
  paymentMode: paymentModeEnum.default('CASH'),
  isRecurring: z.coerce.boolean().default(false),
  notes: z.string().optional(),
  bankAccountId: z.string().optional().nullable(),
  cashAmount: z.preprocess((val) => (typeof val === 'string' && val !== '' ? parseFloat(val) : val), z.number().optional().nullable()),
  upiAmount: z.preprocess((val) => (typeof val === 'string' && val !== '' ? parseFloat(val) : val), z.number().optional().nullable()),
});

const updateExpenseSchema = createExpenseSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  createCategorySchema,
};
