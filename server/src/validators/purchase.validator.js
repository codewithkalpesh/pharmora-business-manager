// src/validators/purchase.validator.js
const { z } = require('zod');

const decimal = z.preprocess((val) => (typeof val === 'string' ? parseFloat(val) : val), z.number().min(0));

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().nullable().optional()
);

const gstNumberSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? null : trimmed.toUpperCase();
    }
    return val;
  },
  z.string().regex(gstRegex, 'Invalid GSTIN format (e.g. 27AAAAA1111A1Z1)').nullable().optional()
);

const emailSchema = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().email('Invalid email address').nullable().optional()
);

const createDistributorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  contactPerson: optionalString,
  phone: optionalString,
  email: emailSchema,
  address: optionalString,
  gstNumber: gstNumberSchema,
  creditDays: z.coerce.number().int().min(0, 'Credit days must be 0 or more').default(30),
});

const updateDistributorSchema = createDistributorSchema.partial();

const createBillSchema = z.object({
  invoiceNo: z.string().trim().nonempty('Invoice number is required'),
  distributorId: z.string().nonempty('Distributor is required'),
  billDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  subtotal: decimal,
  gstAmount: decimal.optional().default(0),
  discountAmount: decimal.optional().default(0),
  paidAmount: decimal.optional().default(0),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER']).optional().default('CASH'),
  bankAccountId: optionalString,
  notes: optionalString,
});

const updateBillSchema = createBillSchema.partial();

module.exports = {
  createDistributorSchema,
  updateDistributorSchema,
  createBillSchema,
  updateBillSchema,
};

