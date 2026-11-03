'use strict';

const request = require('supertest');
const createApp = require('../src/app');
const { Product, StockSnapshot, SalesHistory } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

describe('Product and Stock Management (E1)', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = createApp();
  });

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Manager',
      email: 'manager@shop.com',
      password: 'password123',
    });
    token = userRes.body.token;
  });

  describe('Product CRUD', () => {
    it('creates a new product successfully', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'TEE-BLK-S', name: 'Black T-Shirt Small' });

      expect(res.status).toBe(201);
      expect(res.body.product).toMatchObject({
        sku: 'TEE-BLK-S',
        name: 'Black T-Shirt Small',
      });

      const inDb = await Product.findOne({ sku: 'TEE-BLK-S' });
      expect(inDb).toBeTruthy();
    });

    it('rejects duplicate SKU creation with 409 Conflict', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'HOODIE-01', name: 'Original Hoodie' });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'hoodie-01', name: 'Duplicate Hoodie' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('rejects invalid SKU format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'invalid sku with spaces!', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    it('lists products and includes currentStock snapshot info', async () => {
      // Create product
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'CAP-RED', name: 'Red Cap' });

      // Add stock snapshot
      await request(app)
        .post('/api/stock')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'CAP-RED', date: '2026-11-01', unitsAvailable: 150 });

      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0]).toMatchObject({
        sku: 'CAP-RED',
        name: 'Red Cap',
        currentStock: {
          unitsAvailable: 150,
        },
      });
    });

    it('updates a product name and SKU', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'SHIRT-BLU', name: 'Blue Shirt' });

      const productId = createRes.body.product.id;

      const updateRes = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Navy Blue Shirt' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.product.name).toBe('Navy Blue Shirt');
    });

    it('deletes a product', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ sku: 'DELETE-ME', name: 'Item' });

      const productId = createRes.body.product.id;

      const delRes = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);
      expect(await Product.findById(productId)).toBeNull();
    });
  });

  describe('CSV Import (Products, Sales History, Stock Snapshots)', () => {
    it('imports valid products CSV and reports rejected invalid rows', async () => {
      const csv = `sku,name
TEE-001,Basic White T-Shirt
TEE-002,Basic Black T-Shirt
bad sku!?,Invalid SKU Item
,Missing SKU
TEE-003,Striped Tee`;

      const res = await request(app)
        .post('/api/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .field('type', 'products')
        .attach('file', Buffer.from(csv), 'products.csv');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        type: 'products',
        totalRows: 5,
        successCount: 3,
        rejectedCount: 2,
      });

      expect(res.body.rejectedRows.length).toBe(2);
      expect(res.body.rejectedRows[0].row).toBe(4); // row index with header offset
      expect(res.body.rejectedRows[0].reason).toMatch(/Invalid SKU format/i);

      // Verify valid items exist in DB
      const p1 = await Product.findOne({ sku: 'TEE-001' });
      const p2 = await Product.findOne({ sku: 'TEE-002' });
      const p3 = await Product.findOne({ sku: 'TEE-003' });
      expect(p1 && p2 && p3).toBeTruthy();
    });

    it('imports sales history with validation on dates and units', async () => {
      const csv = `sku,date,unitsSold,price,discountPct
TEE-001,2026-10-01,10,25.00,0
TEE-001,2026-10-02,15,20.00,20
TEE-001,not-a-date,10,25.00,0
TEE-001,2026-10-04,-5,25.00,0
TEE-001,2026-10-05,12,30.00,150`;

      const res = await request(app)
        .post('/api/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .field('type', 'sales_history')
        .attach('file', Buffer.from(csv), 'sales.csv');

      expect(res.status).toBe(200);
      expect(res.body.totalRows).toBe(5);
      expect(res.body.successCount).toBe(2);
      expect(res.body.rejectedCount).toBe(3);

      const sales = await SalesHistory.find({ sku: 'TEE-001' });
      expect(sales.length).toBe(2);
    });

    it('imports stock snapshots and handles 0 units as valid stockout day', async () => {
      const csv = `sku,date,unitsAvailable
TEE-001,2026-10-01,50
TEE-001,2026-10-02,0
TEE-001,2026-10-03,-10`;

      const res = await request(app)
        .post('/api/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'stock_snapshots',
          csvText: csv,
        });

      expect(res.status).toBe(200);
      expect(res.body.totalRows).toBe(3);
      expect(res.body.successCount).toBe(2);
      expect(res.body.rejectedCount).toBe(1);
      expect(res.body.rejectedRows[0].reason).toMatch(/cannot be negative/i);

      const snapshots = await StockSnapshot.find({ sku: 'TEE-001' });
      expect(snapshots.length).toBe(2);
    });
  });
});
