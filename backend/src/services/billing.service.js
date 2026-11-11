'use strict';

const env = require('../config/env');
const { User } = require('../models');
const { PLANS } = require('../config/plans');
const ApiError = require('../errors/ApiError');

let stripeClient = null;
if (env.stripeSecretKey) {
  try {
    const Stripe = require('stripe');
    stripeClient = new Stripe(env.stripeSecretKey);
  } catch (err) {
    console.warn(`Stripe SDK initialisation warning: ${err.message}`);
  }
}

/**
 * Creates a Stripe Checkout Session for subscription upgrades,
 * or runs in frictionless simulated mode when no Stripe secret key is present.
 */
async function createCheckoutSession({ user, planKey, successUrl, cancelUrl }) {
  const plan = PLANS[planKey];
  if (!plan) {
    throw ApiError.badRequest(`Invalid plan: ${planKey}`);
  }

  // Downgrading to Starter requires no payment
  if (planKey === 'starter') {
    user.plan = 'starter';
    await user.save();
    return {
      url: `${env.appUrl}/settings?plan=starter&status=switched`,
      plan: 'starter',
      simulated: true,
      message: 'Switched to Starter plan',
    };
  }

  const defaultSuccess = `${env.appUrl}/settings?payment=success&plan=${planKey}&session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancel = `${env.appUrl}/pricing`;

  // Real Stripe Mode
  if (stripeClient) {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `ForecastIQ ${plan.name} Plan`,
              description: `Up to ${plan.maxProducts === Infinity ? 'Unlimited' : plan.maxProducts} products & ${plan.maxCampaigns === Infinity ? 'Unlimited' : plan.maxCampaigns} flash campaigns`,
            },
            unit_amount: plan.priceUsd * 100, // Cents
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id.toString(),
        planKey,
      },
      success_url: successUrl || defaultSuccess,
      cancel_url: cancelUrl || defaultCancel,
    });

    return {
      url: session.url,
      sessionId: session.id,
      simulated: false,
    };
  }

  // Simulated Mode (Graceful demo & development fallback)
  user.plan = planKey;
  user.stripeSubscriptionId = `sub_mock_${Date.now()}`;
  await user.save();

  return {
    url: `${env.appUrl}/settings?payment=success&plan=${planKey}&simulated=true`,
    sessionId: `sim_cs_${Date.now()}`,
    plan: planKey,
    simulated: true,
    message: `Payment simulated successfully! Account upgraded to ${plan.name} plan.`,
  };
}

/**
 * Creates a Stripe Billing Customer Portal session to manage cards and invoices.
 */
async function createPortalSession({ user, returnUrl }) {
  const targetReturn = returnUrl || `${env.appUrl}/settings`;

  if (stripeClient && user.stripeCustomerId) {
    const portal = await stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: targetReturn,
    });
    return { url: portal.url, simulated: false };
  }

  return {
    url: targetReturn,
    simulated: true,
    message: 'Billing portal simulated. You are in self-serve demo mode.',
  };
}

/**
 * Processes incoming Stripe webhooks.
 */
async function processWebhook(rawBody, signature) {
  let event;

  if (stripeClient && env.stripeWebhookSecret && signature) {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } else if (typeof rawBody === 'string') {
    try {
      event = JSON.parse(rawBody);
    } catch {
      event = { type: 'unknown' };
    }
  } else {
    event = rawBody || {};
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data?.object;
      const userId = session?.metadata?.userId;
      const planKey = session?.metadata?.planKey;

      if (userId && planKey) {
        await User.findByIdAndUpdate(userId, {
          plan: planKey,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data?.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription?.id });
      if (user) {
        user.plan = 'starter';
        user.stripeSubscriptionId = undefined;
        await user.save();
      }
      break;
    }

    default:
      break;
  }

  return { received: true };
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  processWebhook,
};
