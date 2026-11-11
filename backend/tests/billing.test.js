'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { User } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Stripe Billing & Subscription API', () => {
  let app;
  let token;
  let user;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Paying Customer',
      email: 'customer@shop.com',
      password: 'password123',
    });
    token = userRes.body.token;
    user = userRes.body.user;
  });

  describe('POST /api/billing/create-checkout-session', () => {
    it('creates a checkout session for Growth plan upgrade', async () => {
      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ planKey: 'growth' });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.sessionId).toBeDefined();

      // In simulated mode, user is upgraded to Growth
      const updatedUser = await User.findById(user.id);
      expect(updatedUser.plan).toBe('growth');
    });

    it('creates a checkout session for Scale plan upgrade', async () => {
      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ planKey: 'scale' });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();

      const updatedUser = await User.findById(user.id);
      expect(updatedUser.plan).toBe('scale');
    });

    it('downgrades to starter plan directly without checkout redirect', async () => {
      // First upgrade to Growth
      await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ planKey: 'growth' });

      // Then downgrade to Starter
      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ planKey: 'starter' });

      expect(res.status).toBe(200);
      expect(res.body.plan).toBe('starter');

      const updatedUser = await User.findById(user.id);
      expect(updatedUser.plan).toBe('starter');
    });

    it('rejects an invalid plan key with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ planKey: 'enterprise-diamond' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/billing/create-portal-session', () => {
    it('creates a billing customer portal session', async () => {
      const res = await request(app)
        .post('/api/billing/create-portal-session')
        .set('Authorization', `Bearer ${token}`)
        .send({ returnUrl: 'http://localhost:3000/settings' });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });
  });

  describe('POST /api/billing/webhook', () => {
    it('handles checkout.session.completed and activates plan', async () => {
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock_123',
            customer: 'cus_test_mock_456',
            subscription: 'sub_test_mock_789',
            metadata: {
              userId: user.id,
              planKey: 'scale',
            },
          },
        },
      };

      const res = await request(app).post('/api/billing/webhook').send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      const updatedUser = await User.findById(user.id);
      expect(updatedUser.plan).toBe('scale');
      expect(updatedUser.stripeCustomerId).toBe('cus_test_mock_456');
      expect(updatedUser.stripeSubscriptionId).toBe('sub_test_mock_789');
    });

    it('handles customer.subscription.deleted and reverts to starter plan', async () => {
      // Set user with active subscription
      await User.findByIdAndUpdate(user.id, {
        plan: 'scale',
        stripeSubscriptionId: 'sub_active_to_cancel',
      });

      const cancelPayload = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_active_to_cancel',
          },
        },
      };

      const res = await request(app).post('/api/billing/webhook').send(cancelPayload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      const revertedUser = await User.findById(user.id);
      expect(revertedUser.plan).toBe('starter');
      expect(revertedUser.stripeSubscriptionId).toBeUndefined();
    });
  });
});
