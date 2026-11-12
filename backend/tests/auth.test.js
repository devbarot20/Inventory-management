'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { User } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Auth API and Authorization', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user with hashed password and returns token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'user',
      });
      expect(res.body.user).not.toHaveProperty('password');

      // Verify in DB that password is saved and hashed (not plain text)
      const userInDb = await User.findOne({ email: 'alice@example.com' }).select('+password');
      expect(userInDb).toBeTruthy();
      expect(userInDb.password).not.toBe('password123');
      expect(await userInDb.comparePassword('password123')).toBe(true);
    });

    it('allows specifying admin role upon registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Admin Boss',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('admin');
    });

    it('rejects registration with existing email with 409 Conflict', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Bob Duplicate',
        email: 'bob@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('validates input fields and returns 400 with details', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: '',
        email: 'invalid-email',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
      expect(res.body.error.details).toBeInstanceOf(Array);
      const fields = res.body.error.details.map((d) => d.field);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Carol',
        email: 'carol@example.com',
        password: 'mypassword',
      });
    });

    it('logs in successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'carol@example.com',
        password: 'mypassword',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('carol@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rejects login with wrong password (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'carol@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('rejects login with non-existent email (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'mypassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Dave',
        email: 'dave@example.com',
        password: 'password123',
      });
      token = res.body.token;
    });

    it('returns current user profile when valid token is supplied', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        name: 'Dave',
        email: 'dave@example.com',
        role: 'user',
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/Missing or invalid Authorization header/i);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid authorization token/i);
    });
  });

  describe('Role-based authorization (GET /api/auth/admin-check)', () => {
    let adminToken;
    let userToken;

    beforeEach(async () => {
      const adminRes = await request(app).post('/api/auth/register').send({
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'password123',
        role: 'admin',
      });
      adminToken = adminRes.body.token;

      const userRes = await request(app).post('/api/auth/register').send({
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123',
        role: 'user',
      });
      userToken = userRes.body.token;
    });

    it('allows access to admin-only endpoint for admin role', async () => {
      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.user.role).toBe('admin');
    });

    it('denies access with 403 Forbidden for non-admin role', async () => {
      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });
  });

  describe('User Profile & Password Management (Phase 1)', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      token = res.body.token;
      userId = res.body.user.id;
    });

    it('updates user display name and notification preferences via PUT /api/auth/profile', async () => {
      const updateRes = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Johnathan Doe',
          notificationPreferences: {
            emailStockoutAlerts: false,
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user.name).toBe('Johnathan Doe');
      expect(updateRes.body.user.notificationPreferences.emailStockoutAlerts).toBe(false);

      // Verify in DB
      const userInDb = await User.findById(userId);
      expect(userInDb.name).toBe('Johnathan Doe');
      expect(userInDb.notificationPreferences.emailStockoutAlerts).toBe(false);
    });

    it('updates preferred currency via PUT /api/auth/profile', async () => {
      const updateRes = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ currency: 'EUR' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user.currency).toBe('EUR');

      const userInDb = await User.findById(userId);
      expect(userInDb.currency).toBe('EUR');
    });

    it('rejects invalid currency code', async () => {
      const badRes = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ currency: 'XYZ' });

      expect(badRes.status).toBe(400);
    });

    it('successfully changes password with valid current password', async () => {
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newsecurepassword99',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.message).toMatch(/Password changed successfully/i);

      // Verify login with new password succeeds
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'newsecurepassword99',
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();

      // Verify old password no longer works
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'password123',
      });
      expect(oldLoginRes.status).toBe(401);
    });

    it('rejects password change if current password does not match', async () => {
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newsecurepassword99',
        });

      expect(changeRes.status).toBe(400);
      expect(changeRes.body.error.message).toMatch(/Current password is incorrect/i);
    });
  });
});
