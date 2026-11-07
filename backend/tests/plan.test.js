'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { Product } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Subscription plans', () => {
  let app;
  let token;
  let userId;

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const setPlan = (plan) => request(app).patch('/api/auth/plan').set(auth()).send({ plan });

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Plan User',
      email: 'plan@shop.com',
      password: 'password123',
    });
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('defaults new users to the starter plan', async () => {
    const res = await request(app).get('/api/auth/me').set(auth());
    expect(res.body.user.plan).toBe('starter');
  });

  it('reports plan limits and current usage', async () => {
    await request(app).post('/api/products').set(auth()).send({ sku: 'U-1', name: 'One' });
    const res = await request(app).get('/api/auth/usage').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.plan).toMatchObject({ id: 'starter', maxProducts: 25, maxCampaigns: 3, csvImport: false });
    expect(res.body.usage).toEqual({ products: 1, campaigns: 0 });
  });

  it('lets a user change plan and rejects unknown plans', async () => {
    const ok = await setPlan('growth');
    expect(ok.status).toBe(200);
    expect(ok.body.user.plan).toBe('growth');

    const bad = await setPlan('enterprise');
    expect(bad.status).toBe(400);

    const anon = await request(app).patch('/api/auth/plan').send({ plan: 'scale' });
    expect(anon.status).toBe(401);
  });

  it('blocks product creation beyond the starter limit of 25', async () => {
    await Product.insertMany(
      Array.from({ length: 25 }, (_, i) => ({ sku: `SKU-${i}`, name: `P${i}`, createdBy: userId })),
    );
    const res = await request(app)
      .post('/api/products')
      .set(auth())
      .send({ sku: 'EXTRA-1', name: 'Extra' });
    expect(res.status).toBe(403);
    expect(res.body.error.details.code).toBe('PLAN_LIMIT');

    await setPlan('growth');
    const after = await request(app)
      .post('/api/products')
      .set(auth())
      .send({ sku: 'EXTRA-1', name: 'Extra' });
    expect(after.status).toBe(201);
  });

  it('blocks flash-sale creation beyond 3 campaigns on starter', async () => {
    await Product.create({ sku: 'TEE-01', name: 'Vintage Tee' });
    const payload = (n) => ({
      name: `Sale ${n}`,
      startDate: '2026-12-01T00:00:00Z',
      endDate: '2026-12-03T00:00:00Z',
      discountPct: 20,
      products: ['TEE-01'],
    });
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await request(app).post('/api/sales').set(auth()).send(payload(i));
      expect(ok.status).toBe(201);
    }
    const blocked = await request(app).post('/api/sales').set(auth()).send(payload(4));
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.details.code).toBe('PLAN_LIMIT');
  });

  it('gates CSV import to Growth and above', async () => {
    const denied = await request(app)
      .post('/api/import/csv')
      .set(auth())
      .send({ type: 'products', csvText: 'sku,name\nA-1,Alpha' });
    expect(denied.status).toBe(403);
    expect(denied.body.error.details.code).toBe('PLAN_FEATURE');

    await setPlan('growth');
    const allowed = await request(app)
      .post('/api/import/csv')
      .set(auth())
      .send({ type: 'products', csvText: 'sku,name\nA-1,Alpha' });
    expect(allowed.status).not.toBe(403);
  });
});

describe('Password reset', () => {
  const mailer = require('../src/services/mailer');
  let app;
  let sent;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    sent = null;
    jest.spyOn(mailer, 'sendPasswordReset').mockImplementation(async (to, name, url) => {
      sent = { to, url };
    });
    await request(app).post('/api/auth/register').send({
      name: 'Reset User',
      email: 'reset@shop.com',
      password: 'oldpassword',
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('answers identically for unknown emails and sends nothing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@shop.com' });
    expect(res.status).toBe(200);
    expect(sent).toBeNull();
  });

  it('emails a one-time link that sets a new password', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@shop.com' });
    expect(res.status).toBe(200);
    expect(sent.to).toBe('reset@shop.com');

    const token = new URL(sent.url).searchParams.get('token');
    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'newpassword1' });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'reset@shop.com', password: 'oldpassword' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/api/auth/login').send({ email: 'reset@shop.com', password: 'newpassword1' });
    expect(newLogin.status).toBe(200);

    const reuse = await request(app).post('/api/auth/reset-password').send({ token, password: 'another-pass' });
    expect(reuse.status).toBe(400);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'x'.repeat(64), password: 'newpassword1' });
    expect(res.status).toBe(400);
  });
});

describe('Email verification', () => {
  const mailer = require('../src/services/mailer');
  const env = require('../src/config/env');
  let app;
  let emails;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    emails = [];
    env.emailVerificationEnabled = true;
    jest.spyOn(mailer, 'sendVerification').mockImplementation(async (to, name, url) => {
      emails.push({ to, url });
    });
    jest.spyOn(mailer, 'sendPasswordReset').mockImplementation(async (to, name, url) => {
      emails.push({ to, url });
    });
  });

  afterEach(() => {
    env.emailVerificationEnabled = false;
    jest.restoreAllMocks();
  });

  const signUp = async (email = 'verify@shop.com') => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Vera', email, password: 'password123' });
    return res.body;
  };
  const tokenFrom = (url) => new URL(url).searchParams.get('token');

  it('marks new accounts unverified, emails a link and blocks data routes until verified', async () => {
    const { token, user } = await signUp();
    expect(user.emailVerified).toBe(false);
    expect(user).not.toHaveProperty('verifyTokenHash');
    expect(emails).toHaveLength(1);

    const blocked = await request(app).get('/api/products').set({ Authorization: `Bearer ${token}` });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.details.code).toBe('EMAIL_NOT_VERIFIED');

    const me = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${token}` });
    expect(me.status).toBe(200);
    expect(me.body.user.emailVerified).toBe(false);

    const verified = await request(app).post('/api/auth/verify-email').send({ token: tokenFrom(emails[0].url) });
    expect(verified.status).toBe(200);

    const ok = await request(app).get('/api/products').set({ Authorization: `Bearer ${token}` });
    expect(ok.status).toBe(200);

    const reuse = await request(app).post('/api/auth/verify-email').send({ token: tokenFrom(emails[0].url) });
    expect(reuse.status).toBe(400);
  });

  it('resends a working link and rejects bad tokens', async () => {
    const { token } = await signUp('resend@shop.com');
    const resend = await request(app).post('/api/auth/resend-verification').set({ Authorization: `Bearer ${token}` });
    expect(resend.status).toBe(200);
    expect(emails).toHaveLength(2);

    const bad = await request(app).post('/api/auth/verify-email').send({ token: 'z'.repeat(64) });
    expect(bad.status).toBe(400);

    const good = await request(app).post('/api/auth/verify-email').send({ token: tokenFrom(emails[1].url) });
    expect(good.status).toBe(200);
  });

  it('treats a completed password reset as proof of email ownership', async () => {
    const { token } = await signUp('forgot@shop.com');
    await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@shop.com' });
    const resetMail = emails[emails.length - 1];
    await request(app).post('/api/auth/reset-password').send({ token: tokenFrom(resetMail.url), password: 'brandnewpass' });

    const ok = await request(app).get('/api/products').set({ Authorization: `Bearer ${token}` });
    expect(ok.status).toBe(200);
  });

  it('does not require verification when the feature is off', async () => {
    env.emailVerificationEnabled = false;
    const { token, user } = await signUp('off@shop.com');
    expect(user.emailVerified).toBe(true);
    const ok = await request(app).get('/api/products').set({ Authorization: `Bearer ${token}` });
    expect(ok.status).toBe(200);
  });
});
