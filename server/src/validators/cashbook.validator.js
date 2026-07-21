// src/validators/cashbook.validator.js
const { z } = require('zod');

const cashBookSchema = z.object({
  date: z.string().or(z.date()),
  openingCash: z.number().min(0).default(0),
  cashSales: z.number().min(0).default(0),
  upiReceipts: z.number().min(0).default(0),
  cardReceipts: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  totalExpenses: z.number().min(0).default(0),
  bankDeposit: z.number().min(0).default(0),
  closingCash: z.number().min(0).default(0),
  cashDifference: z.number().default(0),
  notes: z.string().optional().nullable(),
});

module.exports = {
  cashBookSchema,
};
