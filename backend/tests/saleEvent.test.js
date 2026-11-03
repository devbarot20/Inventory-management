'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { SaleEvent, Product } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Sale Event and Campaign Planning (E2)', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Sales Planner',
      email: 'planner@shop.com',
      password: 'password123',
    });
    token = userRes.body.token;

    // Seed test products
    await Product.create([
      { sku: 'TEE-01', name: 'Vintage Tee' },
      { sku: 'CAP-01', name: 'Snapback Cap' },
    ]);
  });

  describe('POST /api/sales', () => {
    it('creates a flash sale with planned TikTok spend and separate actual spend', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Black Friday 2026',
          startDate: '2026-11-27T00:00:00Z',
          endDate: '2026-11-29T00:00:00Z',
          discountPct: 35,
          plannedSpend: 1500,
          campaignLabel: 'TikTok @fashion_viral Campaign',
          products: ['TEE-01', 'CAP-01'],
        });

      expect(res.status).toBe(201);
      const sale = res.body.saleEvent;
      expect(sale.name).toBe('Black Friday 2026');
      expect(sale.discountPct).toBe(35);
      expect(sale.plannedSpend).toBe(1500);
      expect(sale.actualSpend).toBeNull(); // actual spend remains null initially
      expect(sale.campaignLabel).toBe('TikTok @fashion_viral Campaign');
      expect(sale.products).toEqual(['TEE-01', 'CAP-01']);
      expect(sale.durationDays).toBe(2);

      const inDb = await SaleEvent.findById(sale.id);
      expect(inDb).toBeTruthy();
      expect(inDb.plannedSpend).toBe(1500);
      expect(inDb.actualSpend).toBeNull();
    });

    it('rejects sale creation when endDate is before startDate (400)', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Dates Sale',
          startDate: '2026-11-29T00:00:00Z',
          endDate: '2026-11-27T00:00:00Z',
          discountPct: 20,
          plannedSpend: 500,
          products: ['TEE-01'],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
      const reasons = res.body.error.details.map((d) => d.message);
      expect(reasons.some((r) => r.includes('End date must be on or after'))).toBe(true);
    });

    it('rejects negative planned spend and discount > 100% (400)', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Bad Spend Sale',
          startDate: '2026-11-27T00:00:00Z',
          endDate: '2026-11-28T00:00:00Z',
          discountPct: 150,
          plannedSpend: -100,
          products: ['TEE-01'],
        });

      expect(res.status).toBe(400);
      const fields = res.body.error.details.map((d) => d.field);
      expect(fields).toContain('discountPct');
      expect(fields).toContain('plannedSpend');
    });

    it('rejects duplicate SKUs in products list (400)', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Duplicate SKU Sale',
          startDate: '2026-11-27T00:00:00Z',
          endDate: '2026-11-28T00:00:00Z',
          discountPct: 20,
          plannedSpend: 200,
          products: ['TEE-01', 'tee-01'],
        });

      expect(res.status).toBe(400);
      const reasons = res.body.error.details.map((d) => d.message);
      expect(reasons.some((r) => r.includes('duplicate SKUs'))).toBe(true);
    });
  });

  describe('GET and PUT /api/sales', () => {
    let saleId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Summer Kickoff',
          startDate: '2026-06-01T00:00:00Z',
          endDate: '2026-06-03T00:00:00Z',
          discountPct: 25,
          plannedSpend: 800,
          campaignLabel: 'Summer Vibe',
          products: ['TEE-01'],
        });
      saleId = res.body.saleEvent.id;
    });

    it('lists sales and includes duration and status', async () => {
      const res = await request(app).get('/api/sales');
      expect(res.status).toBe(200);
      expect(res.body.saleEvents.length).toBe(1);
      expect(res.body.saleEvents[0]).toMatchObject({
        id: saleId,
        name: 'Summer Kickoff',
        plannedSpend: 800,
        actualSpend: null,
        durationDays: 2,
      });
    });

    it('updates actual spend separately after the campaign runs', async () => {
      const updateRes = await request(app)
        .put(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          actualSpend: 840,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.saleEvent.plannedSpend).toBe(800);
      expect(updateRes.body.saleEvent.actualSpend).toBe(840);
    });

    it('deletes a sale event', async () => {
      const delRes = await request(app)
        .delete(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);
      expect(await SaleEvent.findById(saleId)).toBeNull();
    });
  });
});
