'use strict';

const {
  evaluateSkuComparison,
  computeAggregateMetrics,
} = require('../src/services/comparison.service');

describe('Comparison Service Unit Tests (E6)', () => {
  describe('evaluateSkuComparison()', () => {
    it('returns evaluated: false when forecast is null or status is not ok', () => {
      const resNull = evaluateSkuComparison({
        forecast: null,
        actualUnits: 50,
        stockoutOccurred: false,
      });
      expect(resNull.evaluated).toBe(false);
      expect(resNull.error).toBeNull();
      expect(resNull.absoluteError).toBeNull();

      const resNotOk = evaluateSkuComparison({
        forecast: { status: 'not_enough_data', expected: null },
        actualUnits: 50,
        stockoutOccurred: false,
      });
      expect(resNotOk.evaluated).toBe(false);
    });

    it('calculates error, absoluteError, and withinRange accurately', () => {
      const forecast = {
        status: 'ok',
        low: 80,
        expected: 100,
        high: 130,
        unitsAvailable: 150,
        riskLevel: 'low',
      };

      // Exact match
      const resExact = evaluateSkuComparison({
        forecast,
        actualUnits: 100,
        stockoutOccurred: false,
      });
      expect(resExact.evaluated).toBe(true);
      expect(resExact.error).toBe(0);
      expect(resExact.absoluteError).toBe(0);
      expect(resExact.withinRange).toBe(true);
      expect(resExact.unitsLeftOver).toBe(50);
      expect(resExact.unitsShort).toBe(0);

      // Over-forecast (expected > actual)
      const resOver = evaluateSkuComparison({
        forecast,
        actualUnits: 70,
        stockoutOccurred: false,
      });
      expect(resOver.error).toBe(30); // 100 - 70
      expect(resOver.absoluteError).toBe(30);
      expect(resOver.withinRange).toBe(false); // 70 < low(80)
      expect(resOver.unitsLeftOver).toBe(80); // 150 - 70

      // Under-forecast (expected < actual)
      const resUnder = evaluateSkuComparison({
        forecast,
        actualUnits: 120,
        stockoutOccurred: false,
      });
      expect(resUnder.error).toBe(-20); // 100 - 120
      expect(resUnder.absoluteError).toBe(20);
      expect(resUnder.withinRange).toBe(true); // 80 <= 120 <= 130
    });

    it('evaluates stockout warning accuracy correctly for all risk levels', () => {
      const highRiskForecast = {
        status: 'ok',
        low: 50,
        expected: 90,
        high: 120,
        unitsAvailable: 60,
        riskLevel: 'high',
      };

      const lowRiskForecast = {
        status: 'ok',
        low: 50,
        expected: 90,
        high: 120,
        unitsAvailable: 200,
        riskLevel: 'low',
      };

      // High risk warning + stockout occurred => Warning correct
      const res1 = evaluateSkuComparison({
        forecast: highRiskForecast,
        actualUnits: 80,
        stockoutOccurred: true,
      });
      expect(res1.warningCorrect).toBe(true);
      expect(res1.unitsShort).toBe(20); // 80 - 60

      // Low risk warning + stockout occurred => Warning incorrect (missed warning)
      const res2 = evaluateSkuComparison({
        forecast: lowRiskForecast,
        actualUnits: 250,
        stockoutOccurred: true,
      });
      expect(res2.warningCorrect).toBe(false);

      // Low risk warning + NO stockout occurred => Warning correct
      const res3 = evaluateSkuComparison({
        forecast: lowRiskForecast,
        actualUnits: 90,
        stockoutOccurred: false,
      });
      expect(res3.warningCorrect).toBe(true);

      // High risk warning + NO stockout occurred => Warning incorrect (false alarm)
      const res4 = evaluateSkuComparison({
        forecast: highRiskForecast,
        actualUnits: 40,
        stockoutOccurred: false,
      });
      expect(res4.warningCorrect).toBe(false);
    });
  });

  describe('computeAggregateMetrics()', () => {
    it('returns zeroed metrics for empty list', () => {
      const summary = computeAggregateMetrics([]);
      expect(summary.totalSkus).toBe(0);
      expect(summary.mae).toBe(0);
      expect(summary.wapePct).toBe(0);
      expect(summary.biasPct).toBe(0);
    });

    it('computes MAE, WAPE, Bias, WithinRange% and WarningAccuracy% correctly', () => {
      const comparisons = [
        {
          evaluated: true,
          actualUnits: 120,
          expected: 100,
          error: -20,
          absoluteError: 20,
          withinRange: true,
          warningCorrect: true,
          unitsLeftOver: 10,
          unitsShort: 0,
        },
        {
          evaluated: true,
          actualUnits: 80,
          expected: 100,
          error: 20,
          absoluteError: 20,
          withinRange: true,
          warningCorrect: false,
          unitsLeftOver: 50,
          unitsShort: 0,
        },
        {
          evaluated: false,
          actualUnits: 50,
          expected: null,
          error: null,
          absoluteError: null,
          withinRange: null,
          warningCorrect: null,
          unitsLeftOver: null,
          unitsShort: null,
        },
      ];

      const summary = computeAggregateMetrics(comparisons);

      expect(summary.totalSkus).toBe(3);
      expect(summary.evaluatedSkus).toBe(2);
      expect(summary.totalActualUnits).toBe(200);
      expect(summary.totalExpectedUnits).toBe(200);

      // MAE: (20 + 20) / 2 = 20
      expect(summary.mae).toBe(20);

      // WAPE%: (40 / 200) * 100 = 20%
      expect(summary.wapePct).toBe(20);

      // Bias%: ((-20 + 20) / 200) * 100 = 0%
      expect(summary.biasPct).toBe(0);

      // Within Range%: 2 out of 2 = 100%
      expect(summary.withinRangeCount).toBe(2);
      expect(summary.withinRangePct).toBe(100);

      // Warning Accuracy%: 1 out of 2 = 50%
      expect(summary.warningCorrectCount).toBe(1);
      expect(summary.warningAccuracyPct).toBe(50);

      expect(summary.totalUnitsLeftOver).toBe(60);
      expect(summary.totalUnitsShort).toBe(0);
    });
  });
});
