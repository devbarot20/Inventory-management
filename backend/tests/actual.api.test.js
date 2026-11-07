'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const createApp = require('../src/app');
const { User, Product, SaleEvent, ForecastRun, Forecast, Actual } = require('../src/models');
const { signToken } = require('../src/utils/token');

describe('Forecast vs Actuals Comparison API (E6)', () => {
  let mongod;
  let app;
  let testUser;
  let authHeader;
  let saleEvent;
  let forecastRun;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    app = createApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await SaleEvent.deleteMany({});
    await ForecastRun.deleteMany({});
    await Forecast.deleteMany({});
    await Actual.deleteMany({});

    testUser = await User.create({
      name: 'Manager User',
      email: 'manager@shop.com',
      password: 'hashedpassword',
      role: 'admin',
    });
    const token = signToken({ id: testUser._id.toString(), role: testUser.role });
    authHeader = `Bearer ${token}`;

    await Product.create([
      { sku: 'TSHIRT-BLK-M', name: 'Black T-Shirt M' },
      { sku: 'MUG-WHT-01', name: 'White Ceramic Mug' },
    ]);

    saleEvent = await SaleEvent.create({
      name: 'Black Friday Blitz',
      startDate: new Date('2026-11-20T00:00:00Z'),
      endDate: new Date('2026-11-22T00:00:00Z'),
      discountPct: 25,
      plannedSpend: 1000,
      campaignLabel: 'BF-Promo',
      products: ['TSHIRT-BLK-M', 'MUG-WHT-01'],
      createdBy: testUser._id,
    });

    forecastRun = await ForecastRun.create({
      saleEvent: saleEvent._id,
      algorithmVersion: 'v1.0.0-baseline-similar',
      status: 'completed',
      runAt: new Date(),
    });

    await Forecast.create([
      {
        forecastRun: forecastRun._id,
        saleEvent: saleEvent._id,
        sku: 'TSHIRT-BLK-M',
        status: 'ok',
        low: 80,
        expected: 100,
        high: 130,
        unitsAvailable: 90,
        riskLevel: 'high',
        baselineDailyUnits: 10,
        upliftRatio: 5,
      },
      {
        forecastRun: forecastRun._id,
        saleEvent: saleEvent._id,
        sku: 'MUG-WHT-01',
        status: 'ok',
        low: 40,
        expected: 50,
        high: 70,
        unitsAvailable: 150,
        riskLevel: 'low',
        baselineDailyUnits: 5,
        upliftRatio: 5,
      },
    ]);
  });

  describe('POST /api/actuals/:saleEventId (JSON)', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post(`/api/actuals/${saleEvent._id}`)
        .send({
          items: [{ sku: 'TSHIRT-BLK-M', actualUnits: 95 }],
        });

      expect(res.status).toBe(401);
    });

    it('rejects invalid SKU format or negative actual units', async () => {
      const res = await request(app)
        .post(`/api/actuals/${saleEvent._id}`)
        .set('Authorization', authHeader)
        .send({
          items: [{ sku: 'invalid sku!', actualUnits: -5 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/validation failed/i);
    });

    it('records actuals and calculates accurate metrics and updates actualSpend', async () => {
      const res = await request(app)
        .post(`/api/actuals/${saleEvent._id}`)
        .set('Authorization', authHeader)
        .send({
          actualSpend: 1150,
          items: [
            { sku: 'TSHIRT-BLK-M', actualUnits: 95, stockoutOccurred: true },
            { sku: 'MUG-WHT-01', actualUnits: 45, stockoutOccurred: false },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();

      const summary = res.body.summary;
      expect(summary.totalSkus).toBe(2);
      expect(summary.evaluatedSkus).toBe(2);
      expect(summary.totalActualUnits).toBe(140); // 95 + 45
      expect(summary.totalExpectedUnits).toBe(150); // 100 + 50

      // SKU 1: expected 100, actual 95 => error 5, absError 5
      // SKU 2: expected 50, actual 45 => error 5, absError 5
      // MAE: (5 + 5) / 2 = 5
      expect(summary.mae).toBe(5);

      // WAPE%: (10 / 140) * 100 = 7.14%
      expect(summary.wapePct).toBe(7.14);

      // Both are within forecast ranges:
      // T-shirt: 80 <= 95 <= 130 (true)
      // Mug: 40 <= 45 <= 70 (true)
      expect(summary.withinRangePct).toBe(100);

      // Warning accuracy:
      // T-shirt: risk high + stockout occurred => true
      // Mug: risk low + no stockout => true
      expect(summary.warningAccuracyPct).toBe(100);

      // Check DB records
      const updatedSale = await SaleEvent.findById(saleEvent._id);
      expect(updatedSale.actualSpend).toBe(1150);

      const actualRecords = await Actual.find({ saleEvent: saleEvent._id });
      expect(actualRecords).toHaveLength(2);
    });
  });

  describe('POST /api/actuals/import/:saleEventId (CSV)', () => {
    it('imports actuals from csvText and calculates comparison', async () => {
      const csvText = `sku,actualUnits,stockoutOccurred\nTSHIRT-BLK-M,100,true\nMUG-WHT-01,60,false`;

      const res = await request(app)
        .post(`/api/actuals/import/${saleEvent._id}`)
        .set('Authorization', authHeader)
        .send({
          csvText,
          actualSpend: 980,
        });

      expect(res.status).toBe(200);
      expect(res.body.importedCount).toBe(2);
      expect(res.body.summary.evaluatedSkus).toBe(2);

      const updatedSale = await SaleEvent.findById(saleEvent._id);
      expect(updatedSale.actualSpend).toBe(980);
    });

    it('returns 400 when CSV has no valid rows or is empty', async () => {
      const res = await request(app)
        .post(`/api/actuals/import/${saleEvent._id}`)
        .set('Authorization', authHeader)
        .send({
          csvText: 'sku,actualUnits\n',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/actuals/comparison/:saleEventId', () => {
    it('retrieves comparison summary and SKU breakdown', async () => {
      // First record actuals
      await request(app)
        .post(`/api/actuals/${saleEvent._id}`)
        .set('Authorization', authHeader)
        .send({
          actualSpend: 950,
          items: [{ sku: 'TSHIRT-BLK-M', actualUnits: 90, stockoutOccurred: true }],
        });

      const res = await request(app)
        .get(`/api/actuals/comparison/${saleEvent._id}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.saleEvent).toBeDefined();
      expect(res.body.saleEvent.plannedSpend).toBe(1000);
      expect(res.body.saleEvent.actualSpend).toBe(950);
      expect(res.body.summary).toBeDefined();
      expect(res.body.comparisons).toHaveLength(2); // 1 evaluated actual + 1 unrecorded forecast SKU
    });

    it('returns 404 for nonexistent sale event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/actuals/comparison/${fakeId}`)
        .set('Authorization', authHeader);
      expect(res.status).toBe(404);
    });
  });
});
