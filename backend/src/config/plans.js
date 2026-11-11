'use strict';

/**
 * Subscription plans and the limits enforced by the API.
 * No payment is involved yet: a user can switch plan freely via PATCH /api/auth/plan.
 * `Infinity` means unlimited (serialised as null for API clients).
 */
const PLANS = Object.freeze({
  starter: Object.freeze({
    name: 'Starter',
    priceUsd: 0,
    maxProducts: 25,
    maxCampaigns: 3,
    csvImport: false,
  }),
  growth: Object.freeze({
    name: 'Growth',
    priceUsd: 29,
    maxProducts: 250,
    maxCampaigns: 25,
    csvImport: true,
  }),
  scale: Object.freeze({
    name: 'Scale',
    priceUsd: 79,
    maxProducts: Infinity,
    maxCampaigns: Infinity,
    csvImport: true,
  }),
});

const PLAN_IDS = Object.freeze(Object.keys(PLANS));
const DEFAULT_PLAN = 'starter';

function getPlan(planId) {
  return PLANS[planId] || PLANS[DEFAULT_PLAN];
}

function serializePlan(planId) {
  const plan = getPlan(planId);
  const finite = (n) => (Number.isFinite(n) ? n : null);
  return {
    id: PLANS[planId] ? planId : DEFAULT_PLAN,
    name: plan.name,
    maxProducts: finite(plan.maxProducts),
    maxCampaigns: finite(plan.maxCampaigns),
    csvImport: plan.csvImport,
  };
}

module.exports = { PLANS, PLAN_IDS, DEFAULT_PLAN, getPlan, serializePlan };
