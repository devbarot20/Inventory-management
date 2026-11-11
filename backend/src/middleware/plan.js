'use strict';

const ApiError = require('../errors/ApiError');
const { getPlan } = require('../config/plans');
const { Product, SaleEvent } = require('../models');

const RESOURCES = {
  products: { model: Product, limitKey: 'maxProducts', label: 'products' },
  campaigns: { model: SaleEvent, limitKey: 'maxCampaigns', label: 'flash-sale campaigns' },
};

/** Blocks creation once the user's own record count reaches the plan limit. */
function enforceLimit(resource) {
  const cfg = RESOURCES[resource];
  return async (req, res, next) => {
    try {
      const plan = getPlan(req.user.plan);
      const limit = plan[cfg.limitKey];
      if (!Number.isFinite(limit)) return next();

      const used = await cfg.model.countDocuments({ createdBy: req.user._id });
      if (used >= limit) {
        return next(
          ApiError.forbidden(
            `${plan.name} plan limit reached: ${limit} ${cfg.label}. Upgrade your plan to add more.`,
            { code: 'PLAN_LIMIT', resource, limit, used },
          ),
        );
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/** Blocks access to a feature the user's plan does not include. */
function requireFeature(feature, label) {
  return (req, res, next) => {
    const plan = getPlan(req.user.plan);
    if (!plan[feature]) {
      return next(
        ApiError.forbidden(
          `${label} is not included in the ${plan.name} plan. Upgrade to use it.`,
          {
            code: 'PLAN_FEATURE',
            feature,
          },
        ),
      );
    }
    return next();
  };
}

module.exports = { enforceLimit, requireFeature };
