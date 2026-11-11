'use strict';

const billingService = require('../services/billing.service');

async function createCheckoutSession(req, res, next) {
  try {
    const { planKey, successUrl, cancelUrl } = req.body;
    const result = await billingService.createCheckoutSession({
      user: req.user,
      planKey,
      successUrl,
      cancelUrl,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function createPortalSession(req, res, next) {
  try {
    const { returnUrl } = req.body;
    const result = await billingService.createPortalSession({
      user: req.user,
      returnUrl,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await billingService.processWebhook(req.body, signature);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
};
