const { z } = require('zod');

const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountName: z.string().min(1, 'Account name/holder is required').max(100),
  accountNumber: z.string().max(30).optional().nullable(),
  ifscCode: z.string().max(20).optional().nullable(),
  openingBalance: z.number().nonnegative('Opening balance cannot be negative').default(0),
  isPrimary: z.boolean().optional(),
});

const bankTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200),
  referenceNo: z.string().max(100).optional().nullable(),
  transferToId: z.string().optional().nullable(),
});

module.exports = {
  bankAccountSchema,
  bankTransactionSchema,
};
