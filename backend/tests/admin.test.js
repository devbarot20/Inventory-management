'use strict';

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const createApp = require('../src/app');
const { User, Product, SaleEvent } = require('../src/models');
const mailer = require('../src/services/mailer');
const { signToken } = require('../src/utils/token');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');
const ApiError = require('../src/errors/ApiError');
const errorHandler = require('../src/middleware/errorHandler');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Admin Panel API & Security (Section 21)', () => {
  let app;
  let adminUser;
  let regularUser;

  const as = (user) => ({ Authorization: `Bearer ${user.token}` });

  const registerUser = async (name, email, role = 'user') => {
    if (role === 'admin') {
      const user = await User.create({ name, email, password: 'password123', role });
      return { token: signToken({ id: user.id, role: user.role }), id: user.id, user: user.toJSON() };
    }
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password: 'password123' });
    return { token: res.body.token, id: res.body.user.id, user: res.body.user };
  };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    adminUser = await registerUser('Admin Jane', 'admin@jane.com', 'admin');
    regularUser = await registerUser('Regular Joe', 'joe@example.com', 'user');
  });

  describe('RBAC & Route Protection', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const endpoints = [
        ['get', '/api/admin/stats'],
        ['get', '/api/admin/users'],
        ['get', `/api/admin/users/${regularUser.id}`],
        ['patch', `/api/admin/users/${regularUser.id}/role`],
        ['patch', `/api/admin/users/${regularUser.id}/plan`],
        ['delete', `/api/admin/users/${regularUser.id}`],
      ];

      for (const [method, url] of endpoints) {
        const res = await request(app)[method](url);
        expect(res.status).toBe(401);
      }
    });

    it('rejects non-admin users with 403 Forbidden', async () => {
      const endpoints = [
        ['get', '/api/admin/stats'],
        ['get', '/api/admin/users'],
        ['get', `/api/admin/users/${regularUser.id}`],
        ['patch', `/api/admin/users/${regularUser.id}/role`],
        ['patch', `/api/admin/users/${regularUser.id}/plan`],
        ['delete', `/api/admin/users/${regularUser.id}`],
      ];

      for (const [method, url] of endpoints) {
        const res = await request(app)[method](url).set(as(regularUser)).send({});
        expect(res.status).toBe(403);
      }
    });
  });

  describe('GET /api/admin/stats', () => {
    it('returns platform-wide metrics to admin', async () => {
      // Create a product for regularUser
      await Product.create({
        sku: 'SKU-001',
        name: 'Test Widget',
        createdBy: regularUser.id,
      });

      const res = await request(app).get('/api/admin/stats').set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers', 2);
      expect(res.body).toHaveProperty('verifiedUsers');
      expect(res.body).toHaveProperty('planBreakdown');
      expect(res.body.planBreakdown).toHaveProperty('starter');
      expect(res.body.planBreakdown).toHaveProperty('growth');
      expect(res.body.planBreakdown).toHaveProperty('scale');
      expect(res.body).toHaveProperty('totalProducts', 1);
      expect(res.body).toHaveProperty('totalCampaigns', 0);
      expect(res.body).toHaveProperty('totalForecasts', 0);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns paginated list of users', async () => {
      const res = await request(app).get('/api/admin/users').set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBe(1);

      // Verify passwords and hashes are omitted
      const sample = res.body.users[0];
      expect(sample).not.toHaveProperty('password');
      expect(sample).not.toHaveProperty('resetTokenHash');
      expect(sample).not.toHaveProperty('verifyTokenHash');
    });

    it('filters users by search query', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=joe')
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.users[0].email).toBe('joe@example.com');
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('returns a single user detail', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'joe@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set(as(adminUser));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('allows admin to promote user to admin', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser.id}/role`)
        .set(as(adminUser))
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');

      const updated = await User.findById(regularUser.id);
      expect(updated.role).toBe('admin');
    });

    it('prevents an admin from changing their own role', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.id}/role`)
        .set(as(adminUser))
        .send({ role: 'user' });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/cannot change their own role/i);
    });

    it('rejects invalid role with 400', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser.id}/role`)
        .set(as(adminUser))
        .send({ role: 'superadmin' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/admin/users/:id/plan', () => {
    it('allows admin to change user subscription plan', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser.id}/plan`)
        .set(as(adminUser))
        .send({ plan: 'growth' });

      expect(res.status).toBe(200);
      expect(res.body.user.plan).toBe('growth');
    });

    it('prevents admin from changing their own plan via admin route', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.id}/plan`)
        .set(as(adminUser))
        .send({ plan: 'scale' });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/cannot change their own plan/i);
    });

    it('rejects invalid plan with 400', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser.id}/plan`)
        .set(as(adminUser))
        .send({ plan: 'enterprise_nonexistent' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('soft-deactivates user', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${regularUser.id}`)
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deactivated/i);

      const dbUser = await User.findById(regularUser.id);
      expect(dbUser.deletedAt).toBeDefined();

      const oldTokenRequest = await request(app)
        .get('/api/admin/stats')
        .set(as(regularUser));
      expect(oldTokenRequest.status).toBe(401);

      const loginRequest = await request(app).post('/api/auth/login').send({
        email: 'joe@example.com',
        password: 'password123',
      });
      expect(loginRequest.status).toBe(401);

      const activationRequest = await request(app)
        .patch(`/api/admin/users/${regularUser.id}/activation`)
        .set(as(adminUser))
        .send({ active: true });
      expect(activationRequest.status).toBe(200);
      expect(activationRequest.body.user.deletedAt).toBeUndefined();

      const activeList = await request(app)
        .get('/api/admin/users?status=active')
        .set(as(adminUser));
      expect(activeList.body.total).toBe(2);

      const deactivatedList = await request(app)
        .get('/api/admin/users?status=deactivated')
        .set(as(adminUser));
      expect(deactivatedList.body.total).toBe(0);

      const stillRevoked = await request(app)
        .get('/api/auth/me')
        .set(as(regularUser));
      expect(stillRevoked.status).toBe(401);

      const reactivatedLogin = await request(app).post('/api/auth/login').send({
        email: 'joe@example.com',
        password: 'password123',
      });
      expect(reactivatedLogin.status).toBe(200);
    });

    it('prevents admin from deleting themselves', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set(as(adminUser));

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/cannot delete their own account/i);
    });

    it('returns 400 if user is already deactivated', async () => {
      await request(app)
        .delete(`/api/admin/users/${regularUser.id}`)
        .set(as(adminUser));

      const res = await request(app)
        .delete(`/api/admin/users/${regularUser.id}`)
        .set(as(adminUser));

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/already deactivated/i);
    });

    it('returns 404 for non-existent user deletion', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set(as(adminUser));

      expect(res.status).toBe(404);
    });
  });

  describe('Audit Logging Trail', () => {
    it('automatically records audit log when role, plan, or user deactivation occurs', async () => {
      // 1. Change role
      await request(app)
        .patch(`/api/admin/users/${regularUser.id}/role`)
        .set(as(adminUser))
        .send({ role: 'admin' });

      // 2. Change plan
      await request(app)
        .patch(`/api/admin/users/${regularUser.id}/plan`)
        .set(as(adminUser))
        .send({ plan: 'growth' });

      // 3. Deactivate user
      await request(app)
        .delete(`/api/admin/users/${regularUser.id}`)
        .set(as(adminUser));

      // Fetch audit logs
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(res.body.total).toBe(3);

      const actions = res.body.logs.map((l) => l.action);
      expect(actions).toContain('USER_ROLE_CHANGE');
      expect(actions).toContain('USER_PLAN_CHANGE');
      expect(actions).toContain('USER_DEACTIVATED');

      const roleLog = res.body.logs.find((l) => l.action === 'USER_ROLE_CHANGE');
      expect(roleLog.adminEmail).toBe('admin@jane.com');
      expect(roleLog.targetEmail).toBe('joe@example.com');
      expect(roleLog.details).toEqual({ oldRole: 'user', newRole: 'admin' });
      expect(res.body.logs.every((log) => log.status === 'succeeded')).toBe(true);
    });

    it('filters audit logs by action parameter', async () => {
      await request(app)
        .patch(`/api/admin/users/${regularUser.id}/role`)
        .set(as(adminUser))
        .send({ role: 'admin' });

      await request(app)
        .patch(`/api/admin/users/${regularUser.id}/plan`)
        .set(as(adminUser))
        .send({ plan: 'growth' });

      const res = await request(app)
        .get('/api/admin/audit-logs?action=USER_ROLE_CHANGE')
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.logs[0].action).toBe('USER_ROLE_CHANGE');
    });

    it('rejects unauthenticated access to audit logs with 401', async () => {
      const res = await request(app).get('/api/admin/audit-logs');
      expect(res.status).toBe(401);
    });

    it('rejects regular user access to audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set(as(regularUser));
      expect(res.status).toBe(403);
    });
  });

  describe('Admin Rate Limiter', () => {
    it('returns 429 when admin rate limit threshold is exceeded', async () => {
      const testApp = express();
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 2,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (req, res, next) => {
          next(ApiError.tooManyRequests('Too many admin requests from this IP.'));
        },
      });

      testApp.use(testLimiter);
      testApp.get('/test-admin', (req, res) => res.json({ ok: true }));
      testApp.use(errorHandler);

      const r1 = await request(testApp).get('/test-admin');
      expect(r1.status).toBe(200);

      const r2 = await request(testApp).get('/test-admin');
      expect(r2.status).toBe(200);

      const r3 = await request(testApp).get('/test-admin');
      expect(r3.status).toBe(429);
      expect(r3.body.error.message).toMatch(/Too many admin requests/i);
    });
  });

  describe('Extended Admin Operations (Email Verification, Password Reset, Campaigns)', () => {
    it('returns per-user usage stats on GET /api/admin/users/:id', async () => {
      await Product.create({ sku: 'SKU-STATS-1', name: 'Stats Shirt', price: 25, createdBy: regularUser.id });
      const start = new Date(Date.now() + 86400000);
      const end = new Date(Date.now() + 2 * 86400000);
      await SaleEvent.create({
        name: 'Stats Sale',
        startDate: start,
        endDate: end,
        discountPct: 20,
        plannedSpend: 100,
        products: ['SKU-STATS-1'],
        createdBy: regularUser.id,
      });

      const res = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.user.stats).toEqual({
        productsCount: 1,
        campaignsCount: 1,
        forecastsCount: 0,
      });
    });

    it('allows admin to manually verify an unverified user email and logs audit trail', async () => {
      await User.findByIdAndUpdate(regularUser.id, {
        $set: { emailVerificationRequired: true },
        $unset: { emailVerifiedAt: 1 },
      });

      const res = await request(app)
        .post(`/api/admin/users/${regularUser.id}/verify-email`)
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/verified successfully/i);
      expect(res.body.user.emailVerified).toBe(true);

      const logsRes = await request(app)
        .get('/api/admin/audit-logs?action=USER_EMAIL_VERIFIED')
        .set(as(adminUser));
      expect(logsRes.status).toBe(200);
      expect(logsRes.body.total).toBe(1);
    });

    it('allows admin to trigger password reset email for a user and logs audit trail', async () => {
      const resetSpy = jest.spyOn(mailer, 'sendPasswordReset').mockResolvedValue({ delivered: true });

      const res = await request(app)
        .post(`/api/admin/users/${regularUser.id}/reset-password`)
        .set(as(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Password reset link sent/i);
      expect(resetSpy).toHaveBeenCalledWith(
        'joe@example.com',
        expect.any(String),
        expect.stringContaining('/reset-password?token='),
      );
      resetSpy.mockRestore();

      const logsRes = await request(app)
        .get('/api/admin/audit-logs?action=USER_PASSWORD_RESET_TRIGGERED')
        .set(as(adminUser));
      expect(logsRes.status).toBe(200);
      expect(logsRes.body.total).toBe(1);
    });

    it('lists platform campaigns with search and status filtering on GET /api/admin/campaigns', async () => {
      const now = Date.now();
      await SaleEvent.create([
        {
          name: 'Upcoming Mega Flash',
          startDate: new Date(now + 48 * 3600 * 1000),
          endDate: new Date(now + 72 * 3600 * 1000),
          discountPct: 30,
          plannedSpend: 500,
          products: ['SKU-A', 'SKU-B'],
          createdBy: regularUser.id,
        },
        {
          name: 'Past Winter Promo',
          startDate: new Date(now - 10 * 86400 * 1000),
          endDate: new Date(now - 8 * 86400 * 1000),
          discountPct: 15,
          plannedSpend: 100,
          products: ['SKU-C'],
          createdBy: regularUser.id,
        },
      ]);

      const allRes = await request(app)
        .get('/api/admin/campaigns')
        .set(as(adminUser));
      expect(allRes.status).toBe(200);
      expect(allRes.body.total).toBe(2);
      expect(allRes.body.campaigns[0].ownerEmail).toBe('joe@example.com');

      const upcomingRes = await request(app)
        .get('/api/admin/campaigns?status=upcoming&search=Mega')
        .set(as(adminUser));
      expect(upcomingRes.status).toBe(200);
      expect(upcomingRes.body.total).toBe(1);
      expect(upcomingRes.body.campaigns[0].name).toBe('Upcoming Mega Flash');

      const forbiddenRes = await request(app)
        .get('/api/admin/campaigns')
        .set(as(regularUser));
      expect(forbiddenRes.status).toBe(403);
    });
  });
});
