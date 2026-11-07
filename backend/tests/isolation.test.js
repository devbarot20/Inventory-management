'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Per-user data isolation', () => {
  let app;
  let alice;
  let bob;

  const as = (user) => ({ Authorization: `Bearer ${user.token}` });
  const register = async (name, email) => {
    const res = await request(app).post('/api/auth/register').send({ name, email, password: 'password123' });
    return { token: res.body.token, id: res.body.user.id };
  };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    alice = await register('Alice', 'alice@shop.com');
    bob = await register('Bob', 'bob@shop.com');
  });

  it('requires authentication on read endpoints', async () => {
    for (const path of ['/api/products', '/api/sales', '/api/stock']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });

  it('only lists a user’s own products and lets two users share the same SKU', async () => {
    const a = await request(app).post('/api/products').set(as(alice)).send({ sku: 'TEE-1', name: 'Alice Tee' });
    const b = await request(app).post('/api/products').set(as(bob)).send({ sku: 'TEE-1', name: 'Bob Tee' });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const aliceList = await request(app).get('/api/products').set(as(alice));
    expect(aliceList.body.products.map((p) => p.name)).toEqual(['Alice Tee']);
    const bobList = await request(app).get('/api/products').set(as(bob));
    expect(bobList.body.products.map((p) => p.name)).toEqual(['Bob Tee']);
  });

  it('prevents reading, editing or deleting another user’s product', async () => {
    const created = await request(app).post('/api/products').set(as(alice)).send({ sku: 'CAP-1', name: 'Cap' });
    const id = created.body.product.id;

    expect((await request(app).get(`/api/products/${id}`).set(as(bob))).status).toBe(404);
    expect((await request(app).put(`/api/products/${id}`).set(as(bob)).send({ name: 'Hacked' })).status).toBe(404);
    expect((await request(app).delete(`/api/products/${id}`).set(as(bob))).status).toBe(404);

    const still = await request(app).get(`/api/products/${id}`).set(as(alice));
    expect(still.status).toBe(200);
    expect(still.body.product ? still.body.product.name : still.body.name).toBe('Cap');
  });

  it('keeps stock snapshots, sales, forecasts and actuals private', async () => {
    await request(app).post('/api/products').set(as(alice)).send({ sku: 'HOOD-1', name: 'Hoodie' });
    await request(app).post('/api/stock').set(as(alice)).send({ sku: 'HOOD-1', date: '2026-11-01', unitsAvailable: 40 });
    const sale = await request(app).post('/api/sales').set(as(alice)).send({
      name: 'Alice Sale',
      startDate: '2026-12-01T00:00:00Z',
      endDate: '2026-12-02T00:00:00Z',
      discountPct: 20,
      products: ['HOOD-1'],
    });
    const saleId = sale.body.saleEvent.id;

    expect((await request(app).get('/api/stock').set(as(bob))).body.snapshots).toHaveLength(0);
    expect((await request(app).get('/api/sales').set(as(bob))).body.saleEvents).toHaveLength(0);
    expect((await request(app).get(`/api/sales/${saleId}`).set(as(bob))).status).toBe(404);
    expect((await request(app).delete(`/api/sales/${saleId}`).set(as(bob))).status).toBe(404);
    expect((await request(app).post(`/api/forecast/run/${saleId}`).set(as(bob)).send({})).status).toBe(404);
    expect((await request(app).get(`/api/forecast/latest/${saleId}`).set(as(bob))).status).toBe(404);
    expect((await request(app).get(`/api/forecast/runs/${saleId}`).set(as(bob))).status).toBe(404);
    expect((await request(app).get(`/api/actuals/${saleId}`).set(as(bob))).status).toBe(404);
    expect((await request(app).get(`/api/actuals/comparison/${saleId}`).set(as(bob))).status).toBe(404);
    expect(
      (
        await request(app)
          .post(`/api/actuals/${saleId}`)
          .set(as(bob))
          .send({ items: [{ sku: 'HOOD-1', actualUnits: 5 }] })
      ).status,
    ).toBe(404);

    // The owner still has full access.
    expect((await request(app).get(`/api/sales/${saleId}`).set(as(alice))).status).toBe(200);
  });
});
