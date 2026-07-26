// src/validators/payment.validator.js
const { z } = require('zod');

const paymentModes = ['CASH', 'UPI', 'BOTH', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER'];

const createPaymentSchema = z.object({
  distributorId: z.string().min(1, 'Distributor is required'),
  billId: z.string().optional().nullable(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero'),
  paymentMode: z.enum(paymentModes).default('CASH'),
  referenceNo: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  cashAmount: z.number().optional().nullable(),
  upiAmount: z.number().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
});

const updatePaymentSchema = z.object({
  distributorId: z.string().min(1, 'Distributor is required').optional(),
  billId: z.string().optional().nullable(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  amount: z.number().positive().optional(),
  paymentMode: z.enum(paymentModes).optional(),
  referenceNo: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  cashAmount: z.number().optional().nullable(),
  upiAmount: z.number().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
});

module.exports = { createPaymentSchema, updatePaymentSchema };
