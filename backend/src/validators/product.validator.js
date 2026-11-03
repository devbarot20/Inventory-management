'use strict';

const { z } = require('zod');
const { SKU_PATTERN } = require('../models/common');

const productCreateSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(64, 'SKU cannot exceed 64 characters')
    .transform((val) => val.toUpperCase())
    .refine((val) => SKU_PATTERN.test(val), {
      message: 'SKU may contain only letters, numbers, hyphens, and underscores',
    }),
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name cannot exceed 200 characters'),
});

const productUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(200, 'Product name cannot exceed 200 characters')
    .optional(),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(64, 'SKU cannot exceed 64 characters')
    .transform((val) => val.toUpperCase())
    .refine((val) => SKU_PATTERN.test(val), {
      message: 'SKU may contain only letters, numbers, hyphens, and underscores',
    })
    .optional(),
});

const stockSnapshotCreateSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .transform((val) => val.toUpperCase()),
  date: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: 'Invalid date format (must be valid ISO or YYYY-MM-DD)',
  }),
  unitsAvailable: z
    .number({ invalid_type_error: 'Units available must be a number' })
    .int('Units available must be a whole number')
    .min(0, 'Units available cannot be negative'),
});

module.exports = {
  productCreateSchema,
  productUpdateSchema,
  stockSnapshotCreateSchema,
};
