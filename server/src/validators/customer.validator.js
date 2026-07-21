const { z } = require('zod');

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email address').or(z.literal('')).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

const customerCreditSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

const creditCollectionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerCreditId: z.string().optional().nullable(),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Collection date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  referenceNo: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

module.exports = {
  customerSchema,
  customerCreditSchema,
  creditCollectionSchema,
};
