'use strict';

/**
 * Integration tests against an in-memory MongoDB: indexes and uniqueness constraints.
 */
const { Product, SalesHistory, StockSnapshot, User, Actual } = require('../src/models');
const { startTestDB, clearTestDB, stopTestDB } = require('./helpers/db');
const mongoose = require('mongoose');

beforeAll(startTestDB);
afterEach(clearTestDB);
afterAll(stopTestDB);

const DUPLICATE_KEY = 11000;

describe('indexes', () => {
  it('creates sku and date indexes on SalesHistory and StockSnapshot', async () => {
    for (const Model of [SalesHistory, StockSnapshot]) {
      const indexes = await Model.collection.indexes();
      const keys = indexes.map((i) => JSON.stringify(i.key));
      expect(keys).toContain(JSON.stringify({ createdBy: 1, sku: 1, date: 1 }));
      expect(keys).toContain(JSON.stringify({ date: 1 }));
    }
  });

  it('enforces unique product SKU (case-insensitive via normalisation)', async () => {
    await Product.create({ sku: 'TEE-001', name: 'T-shirt' });
    await expect(Product.create({ sku: 'tee-001', name: 'Duplicate' })).rejects.toMatchObject({
      code: DUPLICATE_KEY,
    });
  });

  it('enforces one sales row per SKU per day, even with different times', async () => {
    await SalesHistory.create({ sku: 'A1', date: '2026-05-10T08:00:00Z', unitsSold: 3 });
    await expect(
      SalesHistory.create({ sku: 'A1', date: '2026-05-10T20:00:00Z', unitsSold: 5 }),
    ).rejects.toMatchObject({ code: DUPLICATE_KEY });
  });

  it('enforces unique user email', async () => {
    await User.create({ name: 'A', email: 'a@shop.com', password: 'hash' });
    await expect(
      User.create({ name: 'B', email: 'A@shop.com', password: 'hash' }),
    ).rejects.toMatchObject({ code: DUPLICATE_KEY });
  });

  it('enforces one actual per SKU per sale event', async () => {
    const saleEvent = new mongoose.Types.ObjectId();
    await Actual.create({ sku: 'A1', saleEvent, actualUnits: 4 });
    await expect(Actual.create({ sku: 'A1', saleEvent, actualUnits: 6 })).rejects.toMatchObject({
      code: DUPLICATE_KEY,
    });
  });

  it('does not return the password field by default', async () => {
    await User.create({ name: 'A', email: 'a@shop.com', password: 'hash' });
    const user = await User.findOne({ email: 'a@shop.com' }).lean();
    expect(user).not.toHaveProperty('password');
  });
});
