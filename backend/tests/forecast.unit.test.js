'use strict';

const {
  calculateBaseline,
  findSimilarSalesAndUplift,
  applyOptionalSpendAdjustment,
  forecastProductDemand,
} = require('../src/services/forecast');

describe('Forecasting Service Unit Tests (E3)', () => {
  const targetSale = {
    name: 'Upcoming Black Friday',
    startDate: '2026-11-20T00:00:00.000Z',
    endDate: '2026-11-22T00:00:00.000Z', // 2-day duration
    discountPct: 30,
    plannedSpend: 1000,
  };

  describe('1. Baseline Calculation', () => {
    it('calculates average daily sales from normal days', () => {
      // 10 days of normal history with 10 units sold each day
      const salesHistory = [];
      for (let i = 1; i <= 10; i++) {
        const dayStr = i < 10 ? `0${i}` : `${i}`;
        salesHistory.push({
          date: `2026-11-${dayStr}T00:00:00.000Z`,
          unitsSold: 10,
        });
      }

      const res = calculateBaseline({
        sku: 'TEE-01',
        beforeDate: targetSale.startDate,
        salesHistory,
        stockSnapshots: [],
        saleEvents: [],
      });

      expect(res.hasEnoughData).toBe(true);
      expect(res.baselineDailyUnits).toBe(10);
      expect(res.normalDaysCount).toBe(10);
    });

    it('excludes past sale periods from normal days baseline', () => {
      const salesHistory = [];
      // 10 days of sales: days 1-5 normal (10 units), days 6-7 during a past sale (50 units), days 8-12 normal (10 units)
      for (let i = 1; i <= 12; i++) {
        const dayStr = i < 10 ? `0${i}` : `${i}`;
        salesHistory.push({
          date: `2026-11-${dayStr}T00:00:00.000Z`,
          unitsSold: i >= 6 && i <= 7 ? 50 : 10,
        });
      }

      const pastSales = [
        {
          startDate: '2026-11-06T00:00:00.000Z',
          endDate: '2026-11-07T00:00:00.000Z',
          name: 'Early Flash Sale',
        },
      ];

      const res = calculateBaseline({
        sku: 'TEE-01',
        beforeDate: targetSale.startDate,
        salesHistory,
        stockSnapshots: [],
        saleEvents: pastSales,
      });

      expect(res.hasEnoughData).toBe(true);
      expect(res.excludedSaleDays).toBe(2);
      expect(res.normalDaysCount).toBe(10);
      expect(res.baselineDailyUnits).toBe(10); // Not inflated by the 50 units sold during the sale
    });

    it('excludes stockout days (unitsAvailable = 0) from baseline', () => {
      const salesHistory = [];
      // 10 days of history
      for (let i = 1; i <= 10; i++) {
        const dayStr = i < 10 ? `0${i}` : `${i}`;
        salesHistory.push({
          date: `2026-11-${dayStr}T00:00:00.000Z`,
          unitsSold: i === 5 ? 1 : 10, // day 5 had almost no sales because of stockout
        });
      }

      const stockSnapshots = [
        {
          date: '2026-11-05T00:00:00.000Z',
          unitsAvailable: 0, // Stockout day
        },
      ];

      const res = calculateBaseline({
        sku: 'TEE-01',
        beforeDate: targetSale.startDate,
        salesHistory,
        stockSnapshots,
        saleEvents: [],
      });

      expect(res.hasEnoughData).toBe(true);
      expect(res.excludedStockoutDays).toBe(1);
      expect(res.normalDaysCount).toBe(9);
      expect(res.baselineDailyUnits).toBe(10); // Excluded day 5 with low sales caused by stockout
    });
  });

  describe('2 & 3. Similar Past Sales & Stockout Flagging', () => {
    it('identifies earlier sales with similar length and discount to compute uplift', () => {
      const pastSales = [
        {
          id: 'sale-1',
          name: 'October 48h Flash Sale',
          startDate: '2026-10-10T00:00:00.000Z',
          endDate: '2026-10-12T00:00:00.000Z', // 2 days, similar to target 2 days
          discountPct: 30, // identical to target 30%
          plannedSpend: 800,
          products: ['TEE-01'],
        },
        {
          id: 'sale-2',
          name: 'Annual Week Clearance',
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-09-08T00:00:00.000Z', // 7 days (not similar to 2 days)
          discountPct: 70, // 70% (not similar to 30%)
          plannedSpend: 100,
          products: ['TEE-01'],
        },
      ];

      // History with baseline 10, and sale-1 sales of 25 units/day (uplift 2.5x)
      const salesHistory = [
        // Baseline days before sale-1
        { date: '2026-10-01T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-10-02T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-10-03T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-10-04T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-10-05T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-10-06T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-10-07T00:00:00.000Z', unitsSold: 10 },
        // During sale-1
        { date: '2026-10-10T00:00:00.000Z', unitsSold: 25 },
        { date: '2026-10-11T00:00:00.000Z', unitsSold: 25 },
      ];

      const res = findSimilarSalesAndUplift({
        sku: 'TEE-01',
        targetSale,
        pastSales,
        salesHistory,
        stockSnapshots: [],
      });

      expect(res.similarSalesFound.length).toBe(1);
      expect(res.similarSalesFound[0].name).toBe('October 48h Flash Sale');
      expect(res.similarSalesFound[0].upliftRatio).toBe(2.5);
      expect(res.upliftSummary.expected).toBe(2.5);
      expect(res.upliftSummary.low).toBeLessThanOrEqual(res.upliftSummary.expected);
      expect(res.upliftSummary.high).toBeGreaterThanOrEqual(res.upliftSummary.expected);
    });

    it('flags past sales with stockouts as "demand possibly understated" and excludes them', () => {
      const pastSales = [
        {
          id: 'sale-stockout',
          name: 'September Flash (Stocked Out)',
          startDate: '2026-09-15T00:00:00.000Z',
          endDate: '2026-09-17T00:00:00.000Z',
          discountPct: 30,
          plannedSpend: 800,
          products: ['TEE-01'],
        },
      ];

      const stockSnapshots = [
        {
          date: '2026-09-16T00:00:00.000Z',
          unitsAvailable: 0, // Stockout during the sale!
        },
      ];

      const res = findSimilarSalesAndUplift({
        sku: 'TEE-01',
        targetSale,
        pastSales,
        salesHistory: [],
        stockSnapshots,
        config: { excludeStockoutSales: true },
      });

      expect(res.flaggedSales.length).toBe(1);
      expect(res.flaggedSales[0].reason).toMatch(/demand possibly understated/i);
      expect(res.dataQualityFlags.some((f) => f.includes('demand possibly understated'))).toBe(
        true,
      );
      // Because excludeStockoutSales is true, it is not used in similarSalesFound
      expect(res.similarSalesFound.length).toBe(0);
    });
  });

  describe('4. Insufficient History Handling', () => {
    it('returns "not_enough_data" when history is too short', () => {
      // Only 3 days of sales history (fewer than the required 7 normal days)
      const salesHistory = [
        { date: '2026-11-15T00:00:00.000Z', unitsSold: 10 },
        { date: '2026-11-16T00:00:00.000Z', unitsSold: 12 },
        { date: '2026-11-17T00:00:00.000Z', unitsSold: 8 },
      ];

      const res = forecastProductDemand({
        sku: 'NEW-PRODUCT-01',
        targetSale,
        salesHistory,
        stockSnapshots: [],
        pastSales: [],
      });

      expect(res.status).toBe('not_enough_data');
      expect(res.low).toBeNull();
      expect(res.expected).toBeNull();
      expect(res.high).toBeNull();
      expect(res.reason).toMatch(/minimum required: 7/i);
      expect(res.dataQualityFlags).toContain('not_enough_history');
    });
  });

  describe('5. Optional Planned Spend Adjustment', () => {
    const baseUplifts = { low: 2.0, expected: 2.5, high: 3.2, similarCount: 2 };

    it('does not alter uplifts when spend adjustment is OFF (default)', () => {
      const res = applyOptionalSpendAdjustment({
        upliftSummary: baseUplifts,
        targetPlannedSpend: 2000,
        similarSales: [{ plannedSpend: 500 }],
        enabled: false, // Default is false
      });

      expect(res.applied).toBe(false);
      expect(res.upliftSummary).toEqual(baseUplifts);
      expect(res.assumptions.some((a) => a.includes('disabled'))).toBe(true);
    });

    it('applies elasticity factor when enabled and clearly states assumptions', () => {
      const res = applyOptionalSpendAdjustment({
        upliftSummary: baseUplifts,
        targetPlannedSpend: 2000,
        similarSales: [{ plannedSpend: 500 }],
        enabled: true, // Explicitly opt-in
      });

      expect(res.applied).toBe(true);
      expect(res.upliftSummary.expected).toBeGreaterThan(baseUplifts.expected);
      expect(res.assumptions.some((a) => a.includes('EXPERIMENTAL'))).toBe(true);
      expect(res.assumptions.some((a) => a.includes('Ad spend does not guarantee'))).toBe(true);
    });
  });

  describe('End-to-End Demand Range Invariant', () => {
    it('always preserves 0 <= low <= expected <= high', () => {
      const salesHistory = [];
      for (let i = 1; i <= 14; i++) {
        const dayStr = i < 10 ? `0${i}` : `${i}`;
        salesHistory.push({
          date: `2026-11-${dayStr}T00:00:00.000Z`,
          unitsSold: 20,
        });
      }

      const res = forecastProductDemand({
        sku: 'TEE-01',
        targetSale,
        salesHistory,
        stockSnapshots: [],
        pastSales: [],
      });

      expect(res.status).toBe('ok');
      expect(res.low).toBeGreaterThanOrEqual(0);
      expect(res.low).toBeLessThanOrEqual(res.expected);
      expect(res.expected).toBeLessThanOrEqual(res.high);
      expect(Number.isInteger(res.low)).toBe(true);
      expect(Number.isInteger(res.expected)).toBe(true);
      expect(Number.isInteger(res.high)).toBe(true);
    });
  });
});
