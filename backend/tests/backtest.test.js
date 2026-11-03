'use strict';

const {
  calculateNaiveForecast,
  runTimeOrderedBacktest,
} = require('../src/services/backtest.service');
const { generateBenchmarkSampleData } = require('../scripts/backtest');

describe('Time-Ordered Backtesting Service & Script (E7 / Section 10)', () => {
  describe('calculateNaiveForecast()', () => {
    it('computes flat baseline multiplied by duration in days', () => {
      expect(calculateNaiveForecast({ baselineDailyUnits: 10, durationDays: 3 })).toBe(30);
      expect(calculateNaiveForecast({ baselineDailyUnits: 12.4, durationDays: 2 })).toBe(25);
    });

    it('returns null when baseline is missing or invalid', () => {
      expect(calculateNaiveForecast({ baselineDailyUnits: null, durationDays: 3 })).toBeNull();
      expect(calculateNaiveForecast({ baselineDailyUnits: undefined, durationDays: 3 })).toBeNull();
      expect(calculateNaiveForecast({ baselineDailyUnits: NaN, durationDays: 3 })).toBeNull();
    });
  });

  describe('runTimeOrderedBacktest() invariants', () => {
    it('strictly isolates historical data before targetSale.startDate (no future leakage)', () => {
      const targetSale = {
        id: 'sale-test',
        name: 'Target Sale',
        startDate: new Date('2026-07-01T00:00:00Z'),
        endDate: new Date('2026-07-03T00:00:00Z'),
        discountPct: 20,
        plannedSpend: 500,
        products: ['SKU-TEST-01'],
      };

      // 30 days before sale: 10 units/day
      const salesHistory = [];
      for (let i = 1; i <= 30; i++) {
        const d = new Date(`2026-06-${String(i).padStart(2, '0')}T00:00:00Z`);
        salesHistory.push({
          sku: 'SKU-TEST-01',
          date: d,
          unitsSold: 10,
          price: 20,
          discountPct: 0,
        });
      }

      // Poison record in the FUTURE after targetSale.startDate (huge anomaly that would skew baseline if leaked)
      salesHistory.push({
        sku: 'SKU-TEST-01',
        date: new Date('2026-07-15T00:00:00Z'),
        unitsSold: 5000,
        price: 20,
        discountPct: 0,
      });

      const actualsBySaleAndSku = new Map();
      actualsBySaleAndSku.set('sale-test:SKU-TEST-01', {
        actualUnits: 25,
        stockoutOccurred: false,
      });

      const result = runTimeOrderedBacktest({
        saleEvents: [targetSale],
        salesHistory,
        stockSnapshots: [
          { sku: 'SKU-TEST-01', date: new Date('2026-06-30T00:00:00Z'), unitsAvailable: 100 },
        ],
        actualsBySaleAndSku,
      });

      expect(result.evaluatedSalesCount).toBe(1);
      const evalItem = result.saleReports[0].evaluations[0];

      // Naive forecast for 2 days should be around 20 units (10/day * 2 days), NOT affected by future 5000 units
      expect(evalItem.naiveForecast).toBe(20);
    });

    it('uses plannedSpend only and ignores actualSpend on the target sale', () => {
      const targetSale = {
        id: 'sale-spend-test',
        name: 'Spend Test Sale',
        startDate: new Date('2026-07-01T00:00:00Z'),
        endDate: new Date('2026-07-03T00:00:00Z'),
        discountPct: 20,
        plannedSpend: 100, // Valid planned spend
        actualSpend: 999999, // Unused actual spend
        products: ['SKU-TEST-01'],
      };

      const salesHistory = [];
      for (let i = 1; i <= 30; i++) {
        salesHistory.push({
          sku: 'SKU-TEST-01',
          date: new Date(`2026-06-${String(i).padStart(2, '0')}T00:00:00Z`),
          unitsSold: 10,
        });
      }

      const actualsBySaleAndSku = new Map();
      actualsBySaleAndSku.set('sale-spend-test:SKU-TEST-01', {
        actualUnits: 30,
        stockoutOccurred: false,
      });

      const result = runTimeOrderedBacktest({
        saleEvents: [targetSale],
        salesHistory,
        stockSnapshots: [],
        actualsBySaleAndSku,
      });

      expect(result.evaluatedSalesCount).toBe(1);
      expect(result.saleReports[0].plannedSpend).toBe(100);
      expect(result.saleReports[0].actualSpend).toBeUndefined();
    });

    it('accurately computes MAE and WAPE error improvements over naive baseline on benchmark sample', () => {
      const sample = generateBenchmarkSampleData();
      const result = runTimeOrderedBacktest({
        saleEvents: sample.saleEvents,
        salesHistory: sample.salesHistory,
        stockSnapshots: sample.stockSnapshots,
        actualsBySaleAndSku: sample.actualsBySaleAndSku,
      });

      expect(result.totalSalesBacktested).toBe(3);
      expect(result.evaluatedSalesCount).toBe(3);
      expect(result.totalEvaluations).toBe(7);
      expect(result.totalActualUnits).toBe(480);

      // Model forecast should outperform flat naive baseline on flash sale demand
      expect(result.modelMae).toBeLessThan(result.naiveMae);
      expect(result.modelWapePct).toBeLessThan(result.naiveWapePct);
      expect(result.maeImprovementPct).toBeGreaterThan(0);
      expect(result.wapeImprovementPct).toBeGreaterThan(0);
    });
  });
});
