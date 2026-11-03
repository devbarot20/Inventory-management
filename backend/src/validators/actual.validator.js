'use strict';

const { z } = require('zod');
const { SKU_PATTERN } = require('../models/common');

const actualItemSchema = z.object({
  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => SKU_PATTERN.test(v), {
      message: 'Invalid SKU format',
    }),
  actualUnits: z
    .number({ required_error: 'Actual units is required', invalid_type_error: 'Actual units must be a number' })
    .int('Actual units must be a whole number')
    .min(0, 'Actual units cannot be negative'),
  stockoutOccurred: z.boolean().default(false).optional(),
});

const actualsSubmitSchema = z.object({
  actualSpend: z
    .number({ invalid_type_error: 'Actual spend must be a number' })
    .min(0, 'Actual spend cannot be negative')
    .nullable()
    .optional(),
  items: z
    .array(actualItemSchema)
    .min(1, 'At least one SKU record is required')
    .refine((items) => new Set(items.map((i) => i.sku)).size === items.length, {
      message: 'Items list cannot contain duplicate SKUs',
    }),
});

module.exports = {
  actualItemSchema,
  actualsSubmitSchema,
};
