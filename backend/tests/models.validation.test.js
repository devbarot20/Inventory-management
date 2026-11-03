'use strict';

/**
 * Schema validation tests. These run validate() on documents, so no database is needed.
 */
const mongoose = require('mongoose');

const {
  User,
  Product,
  SalesHistory,
  StockSnapshot,
  SaleEvent,
  ForecastRun,
  Forecast,
  Actual,
} = require('../src/models');

async function validationErrors(doc) {
  try {
    await doc.validate();
    return {};
  } catch (err) {
    return err.errors;
  }
}

const objectId = () => new mongoose.Types.ObjectId();

describe('User', () => {
  it('accepts a valid user, lowercases email and defaults role to user', async () => {
    const user = new User({ name: 'Asha', email: 'Asha@Shop.COM ', password: 'hash' });
    expect(await validationErrors(user)).toEqual({});
    expect(user.email).toBe('asha@shop.com');
    expect(user.role).toBe('user');
  });

  it('rejects invalid email and unknown role', async () => {
    const errors = await validationErrors(
      new User({ name: 'X', email: 'not-an-email', password: 'h', role: 'owner' }),
    );
    expect(errors).toHaveProperty('email');
    expect(errors).toHaveProperty('role');
  });

  it('never exposes the password in JSON', () => {
    const json = new User({ name: 'A', email: 'a@b.co', password: 'secret' }).toJSON();
    expect(json).not.toHaveProperty('password');
    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
  });
});

describe('Product', () => {
  it('normalises SKU to upper case', async () => {
    const product = new Product({ sku: ' tee-001 ', name: 'T-shirt' });
    expect(await validationErrors(product)).toEqual({});
    expect(product.sku).toBe('TEE-001');
  });

  it('rejects SKUs with invalid characters and missing name', async () => {
    const errors = await validationErrors(new Product({ sku: 'bad sku!' }));
    expect(errors).toHaveProperty('sku');
    expect(errors).toHaveProperty('name');
  });
});

describe('SalesHistory', () => {
  it('normalises date to midnight UTC', async () => {
    const row = new SalesHistory({ sku: 'A1', date: '2026-05-10T15:45:00Z', unitsSold: 4 });
    expect(await validationErrors(row)).toEqual({});
    expect(row.date.toISOString()).toBe('2026-05-10T00:00:00.000Z');
  });

  it('rejects negative and fractional units, negative price and discount > 100', async () => {
    const neg = await validationErrors(
      new SalesHistory({ sku: 'A1', date: '2026-05-10', unitsSold: -1, price: -5 }),
    );
    expect(neg.unitsSold.message).toMatch(/cannot be negative/);
    expect(neg).toHaveProperty('price');

    const frac = await validationErrors(
      new SalesHistory({ sku: 'A1', date: '2026-05-10', unitsSold: 1.5, discountPct: 120 }),
    );
    expect(frac.unitsSold.message).toMatch(/whole number/);
    expect(frac).toHaveProperty('discountPct');
  });

  it('rejects invalid dates', async () => {
    const errors = await validationErrors(
      new SalesHistory({ sku: 'A1', date: 'not-a-date', unitsSold: 1 }),
    );
    expect(errors).toHaveProperty('date');
  });
});

describe('StockSnapshot', () => {
  it('rejects negative units available', async () => {
    const errors = await validationErrors(
      new StockSnapshot({ sku: 'A1', date: '2026-05-10', unitsAvailable: -3 }),
    );
    expect(errors).toHaveProperty('unitsAvailable');
  });

  it('accepts zero units (stockout day)', async () => {
    const snap = new StockSnapshot({ sku: 'A1', date: '2026-05-10', unitsAvailable: 0 });
    expect(await validationErrors(snap)).toEqual({});
  });
});

describe('SaleEvent', () => {
  const base = {
    name: '11.11 Flash Sale',
    startDate: '2026-11-11T00:00:00Z',
    endDate: '2026-11-12T00:00:00Z',
    discountPct: 30,
    plannedSpend: 500,
    products: ['tee-001', 'cap-002'],
  };

  it('accepts a valid event, keeps actualSpend separate and computes duration', async () => {
    const event = new SaleEvent(base);
    expect(await validationErrors(event)).toEqual({});
    expect(event.actualSpend).toBeNull();
    expect(event.products).toEqual(['TEE-001', 'CAP-002']);
    expect(event.durationDays).toBe(1);
  });

  it('rejects end date before start date', async () => {
    const errors = await validationErrors(
      new SaleEvent({ ...base, endDate: '2026-11-10T00:00:00Z' }),
    );
    expect(errors.endDate.message).toMatch(/on or after/);
  });

  it('rejects negative spend and duplicate SKUs', async () => {
    const errors = await validationErrors(
      new SaleEvent({ ...base, plannedSpend: -1, actualSpend: -2, products: ['A1', 'a1'] }),
    );
    expect(errors).toHaveProperty('plannedSpend');
    expect(errors).toHaveProperty('actualSpend');
    expect(errors).toHaveProperty('products');
  });
});

describe('ForecastRun', () => {
  it('requires a sale event', async () => {
    const errors = await validationErrors(new ForecastRun({}));
    expect(errors).toHaveProperty('saleEvent');
  });
});

describe('Forecast', () => {
  const base = { forecastRun: objectId(), saleEvent: objectId(), sku: 'A1' };

  it('accepts an ok forecast with ordered estimates', async () => {
    const f = new Forecast({ ...base, status: 'ok', low: 10, expected: 15, high: 25 });
    expect(await validationErrors(f)).toEqual({});
  });

  it('allows null estimates when there is not enough data', async () => {
    const f = new Forecast({ ...base, status: 'not_enough_data' });
    expect(await validationErrors(f)).toEqual({});
    expect(f.riskLevel).toBeNull();
  });

  it('rejects ok forecast with missing or unordered estimates', async () => {
    const missing = await validationErrors(new Forecast({ ...base, status: 'ok', low: 1 }));
    expect(missing).toHaveProperty('expected');
    expect(missing).toHaveProperty('high');

    const unordered = await validationErrors(
      new Forecast({ ...base, status: 'ok', low: 20, expected: 10, high: 30 }),
    );
    expect(unordered.expected.message).toMatch(/low <= expected <= high/);
  });

  it('rejects negative estimates and invalid risk level', async () => {
    const errors = await validationErrors(
      new Forecast({ ...base, status: 'ok', low: -1, expected: 1, high: 2, riskLevel: 'extreme' }),
    );
    expect(errors).toHaveProperty('low');
    expect(errors).toHaveProperty('riskLevel');
  });
});

describe('Actual', () => {
  it('rejects negative actual units', async () => {
    const errors = await validationErrors(
      new Actual({ sku: 'A1', saleEvent: objectId(), actualUnits: -1 }),
    );
    expect(errors).toHaveProperty('actualUnits');
  });

  it('defaults stockoutOccurred to false', async () => {
    const a = new Actual({ sku: 'A1', saleEvent: objectId(), actualUnits: 12 });
    expect(await validationErrors(a)).toEqual({});
    expect(a.stockoutOccurred).toBe(false);
  });
});
