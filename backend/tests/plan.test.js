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
