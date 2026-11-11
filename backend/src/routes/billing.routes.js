'use strict';

const { Router } = require('express');
const billingController = require('../controllers/billing.controller');
const { authenticateVerified: authenticate } = require('../middleware/auth');

const router = Router();

// Create Checkout session (returns checkout url)
router.post('/create-checkout-session', authenticate, billingController.createCheckoutSession);

// Customer billing portal
router.post('/create-portal-session', authenticate, billingController.createPortalSession);

// Webhook endpoint (public with Stripe signature verification)
router.post('/webhook', billingController.handleWebhook);

module.exports = router;
