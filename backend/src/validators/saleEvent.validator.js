'use strict';

const { z } = require('zod');
const { SKU_PATTERN } = require('../models/common');

const saleEventCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Sale name is required')
      .max(200, 'Sale name cannot exceed 200 characters'),
    startDate: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: 'Invalid start date format (must be valid ISO or YYYY-MM-DD)',
    }),
    endDate: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: 'Invalid end date format (must be valid ISO or YYYY-MM-DD)',
    }),
    discountPct: z
      .number({ invalid_type_error: 'Discount percentage must be a number' })
      .min(0, 'Discount cannot be negative')
      .max(100, 'Discount cannot exceed 100%'),
    plannedSpend: z
      .number({ invalid_type_error: 'Planned spend must be a number' })
      .min(0, 'Planned spend cannot be negative')
      .default(0),
    actualSpend: z
      .number({ invalid_type_error: 'Actual spend must be a number' })
      .min(0, 'Actual spend cannot be negative')
      .nullable()
      .optional(),
    campaignLabel: z
      .string()
      .trim()
      .max(100, 'Campaign label cannot exceed 100 characters')
      .default(''),
    products: z
      .array(
        z
          .string()
          .trim()
          .transform((v) => v.toUpperCase())
          .refine((v) => SKU_PATTERN.test(v), {
            message: 'Invalid SKU in products list',
          }),
      )
      .min(1, 'At least one product SKU must be linked to the sale')
      .refine((items) => new Set(items).size === items.length, {
        message: 'Products list cannot contain duplicate SKUs',
      }),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

const saleEventUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Sale name is required').max(200).optional(),
    startDate: z
      .string()
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: 'Invalid start date format',
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: 'Invalid end date format',
      })
      .optional(),
    discountPct: z.number().min(0).max(100).optional(),
    plannedSpend: z.number().min(0).optional(),
    actualSpend: z.number().min(0).nullable().optional(),
    campaignLabel: z.string().trim().max(100).optional(),
    products: z
      .array(
        z
          .string()
          .trim()
          .transform((v) => v.toUpperCase())
          .refine((v) => SKU_PATTERN.test(v), {
            message: 'Invalid SKU in products list',
          }),
      )
      .refine((items) => new Set(items).size === items.length, {
        message: 'Products list cannot contain duplicate SKUs',
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after the start date',
      path: ['endDate'],
    },
  );

module.exports = {
  saleEventCreateSchema,
  saleEventUpdateSchema,
};
