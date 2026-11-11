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
  category: z.string().trim().max(100).optional(),
  parentGroup: z.string().trim().max(100).optional(),
  size: z.string().trim().max(30).optional(),
  color: z.string().trim().max(50).optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  initialStock: z.number().int().min(0).optional(),
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
  category: z.string().trim().max(100).optional(),
  parentGroup: z.string().trim().max(100).optional(),
  size: z.string().trim().max(30).optional(),
  color: z.string().trim().max(50).optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
});

const variantMatrixSchema = z.object({
  baseName: z.string().trim().min(1, 'Base product name is required').max(150),
  baseSkuPrefix: z
    .string()
    .trim()
    .min(1, 'Base SKU prefix is required')
    .max(30)
    .transform((val) => val.toUpperCase())
    .refine((val) => SKU_PATTERN.test(val), {
      message: 'Base SKU prefix may contain only letters, numbers, hyphens, and underscores',
    }),
  category: z.string().trim().max(100).optional(),
  sizes: z.array(z.string().trim().min(1)).min(1, 'At least one size is required'),
  colors: z.array(z.string().trim().min(1)).min(1, 'At least one color is required'),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  initialStock: z.number().int().min(0).optional(),
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
  variantMatrixSchema,
  stockSnapshotCreateSchema,
};
