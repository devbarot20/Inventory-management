'use strict';

const { z } = require('zod');
const { ROLES } = require('../models/User');
const { PLAN_IDS } = require('../config/plans');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(254, 'Email is too long')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  role: z
    .enum(ROLES, { errorMap: () => ({ message: `Role must be one of: ${ROLES.join(', ')}` }) })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const planSchema = z.object({
  plan: z.enum(PLAN_IDS, { errorMap: () => ({ message: `Plan must be one of: ${PLAN_IDS.join(', ')}` }) }),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Reset token is invalid'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});

module.exports = {
  forgotPasswordSchema,
  resetPasswordSchema,
  planSchema,
  registerSchema,
  loginSchema,
};
