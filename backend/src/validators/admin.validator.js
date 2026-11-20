'use strict';

const { z } = require('zod');
const { ROLES } = require('../models/User');
const { PLAN_IDS } = require('../config/plans');

const adminUpdateRoleSchema = z.object({
  role: z.enum(ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${ROLES.join(', ')}` }),
  }),
});

const adminUpdatePlanSchema = z.object({
  plan: z.enum(PLAN_IDS, {
    errorMap: () => ({ message: `Plan must be one of: ${PLAN_IDS.join(', ')}` }),
  }),
});

const adminUpdateActivationSchema = z.object({
  active: z.boolean(),
});

module.exports = {
  adminUpdateRoleSchema,
  adminUpdatePlanSchema,
  adminUpdateActivationSchema,
};
