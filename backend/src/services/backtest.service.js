'use strict';

const { toUtcDay } = require('../models/common');
const { calculateBaseline } = require('./forecast/baseline');
const { forecastProductDemand } = require('./forecast/forecaster');
const { getDurationInDays } = require('./forecast/similarSales');

/**
 * Calculates naive flat baseline for a SKU during a sale.
 * Naive forecast = baselineDailyUnits * durationDays.
 */
function calculateNaiveForecast({ baselineDailyUnits, durationDays }) {
  if (
    baselineDailyUnits === null ||
    baselineDailyUnits === undefined ||
    isNaN(baselineDailyUnits)
  ) {
    return null;
  }
  return Math.round(baselineDailyUnits * durationDays);
}

/**
 * Runs a time-ordered backtest over a set of completed sale events.
 *
 * Strict invariants:
 * 1. For each target sale, only sales history strictly before targetSale.startDate is used.
 * 2. Only past sales that ended strictly before targetSale.startDate are used for uplift matching.
 * 3. Only plannedSpend is used in targetSale (never actualSpend).
 * 4. Model forecasts (baseline + similar-sale uplift) are compared against actual sales
 *    AND against a naive baseline (flat baseline * duration).
 *
 * @param {Object} params
 * @param {Array} params.saleEvents - list of past sale events to evaluate
 * @param {Array} params.salesHistory - historical sales records
 * @param {Array} params.stockSnapshots - historical stock snapshots
 * @param {Map|Object|Array} [params.actualsBySaleAndSku] - known actuals for (saleId, sku)
 * @param {Object} [params.config] - optional forecaster config
 */
function runTimeOrderedBacktest({
  saleEvents = [],
  salesHistory = [],
  stockSnapshots = [],
  actualsBySaleAndSku = new Map(),
  config = {},
}) {
  // Sort target sales chronologically by startDate
  const sortedSales = [...saleEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const saleReports = [];
  const allEvaluations = [];

  for (const targetSale of sortedSales) {
    const saleId = targetSale.id || targetSale._id?.toString();
    const targetStartTime = toUtcDay(targetSale.startDate).getTime();
    const durationDays = getDurationInDays(targetSale.startDate, targetSale.endDate);
    const skus = targetSale.products || [];

    // 1. Strict temporal filtering: NO future data leakage!
    const availableSalesHistory = salesHistory.filter((row) => {
      const rowDate = toUtcDay(row.date).getTime();
      return rowDate < targetStartTime;
    });

    const availableStockSnapshots = stockSnapshots.filter((snap) => {
      const snapDate = toUtcDay(snap.date).getTime();
      return snapDate < targetStartTime;
    });

    const availablePastSales = sortedSales.filter((s) => {
      const sId = s.id || s._id?.toString();
      const sEndTime = toUtcDay(s.endDate).getTime();
      return sId !== saleId && sEndTime < targetStartTime;
    });

    // 2. Target sale input uses plannedSpend only!
    const targetSaleInput = {
      id: saleId,
      name: targetSale.name,
      startDate: targetSale.startDate,
      endDate: targetSale.endDate,
      discountPct: targetSale.discountPct,
      plannedSpend: targetSale.plannedSpend || 0, // planned spend only
    };

    const skuEvaluations = [];

    for (const sku of skus) {
      // Find actual units sold for this sale & sku
      let actualUnits = null;
      let stockoutOccurred = false;

      // Look up in actuals map
      const actualKey = `${saleId}:${sku}`;
      if (actualsBySaleAndSku instanceof Map && actualsBySaleAndSku.has(actualKey)) {
        const act = actualsBySaleAndSku.get(actualKey);
        actualUnits = act.actualUnits;
        stockoutOccurred = Boolean(act.stockoutOccurred);
      } else if (typeof actualsBySaleAndSku === 'object' && actualsBySaleAndSku[actualKey]) {
        const act = actualsBySaleAndSku[actualKey];
        actualUnits = act.actualUnits;
        stockoutOccurred = Boolean(act.stockoutOccurred);
      } else {
        // Fallback: sum salesHistory during the sale event dates
        const saleStart = toUtcDay(targetSale.startDate).getTime();
        const saleEnd = toUtcDay(targetSale.endDate).getTime();
        const rowsInSale = salesHistory.filter((r) => {
          const t = toUtcDay(r.date).getTime();
          return r.sku === sku && t >= saleStart && t <= saleEnd;
        });
        if (rowsInSale.length > 0) {
          actualUnits = rowsInSale.reduce((sum, r) => sum + r.unitsSold, 0);
        }
      }

      if (actualUnits === null || actualUnits === undefined) {
        // Skip SKU if no ground truth actuals available for evaluation
        continue;
      }

      // Filter SKU specific rows from temporally isolated sets
      const skuHistory = availableSalesHistory.filter((r) => r.sku === sku);
      const skuStock = availableStockSnapshots.filter((s) => s.sku === sku);

      // Run Model Forecast
      const modelForecast = forecastProductDemand({
        sku,
        targetSale: targetSaleInput,
        salesHistory: skuHistory,
        stockSnapshots: skuStock,
        pastSales: availablePastSales,
        config,
      });

      // Compute Baseline
      const baselineRes = calculateBaseline({
        sku,
        beforeDate: targetSale.startDate,
        salesHistory: skuHistory,
        stockSnapshots: skuStock,
        saleEvents: availablePastSales,
        config,
      });

      const naiveForecast = calculateNaiveForecast({
        baselineDailyUnits: baselineRes.baselineDailyUnits,
        durationDays,
      });

      const isModelOk = modelForecast.status === 'ok' && modelForecast.expected !== null;
      const isNaiveOk = naiveForecast !== null;

      if (!isModelOk || !isNaiveOk) {
        continue;
      }

      // Model error
      const modelError = modelForecast.expected - actualUnits;
      const modelAbsError = Math.abs(modelError);
      const withinRange = actualUnits >= modelForecast.low && actualUnits <= modelForecast.high;

      // Naive error
      const naiveError = naiveForecast - actualUnits;
      const naiveAbsError = Math.abs(naiveError);

      const evaluation = {
        saleId,
        saleName: targetSale.name,
        sku,
        actualUnits,
        stockoutOccurred,
        naiveForecast,
        naiveAbsError,
        modelLow: modelForecast.low,
        modelExpected: modelForecast.expected,
        modelHigh: modelForecast.high,
        modelAbsError,
        modelError,
        withinRange,
        upliftRatio: modelForecast.upliftRatio,
        similarSalesUsed: modelForecast.similarSalesUsed,
      };

      skuEvaluations.push(evaluation);
      allEvaluations.push(evaluation);
    }

    if (skuEvaluations.length > 0) {
      const saleActualTotal = skuEvaluations.reduce((sum, e) => sum + e.actualUnits, 0);
      const saleModelAbsErrorTotal = skuEvaluations.reduce((sum, e) => sum + e.modelAbsError, 0);
      const saleNaiveAbsErrorTotal = skuEvaluations.reduce((sum, e) => sum + e.naiveAbsError, 0);
      const saleWithinRangeCount = skuEvaluations.filter((e) => e.withinRange).length;

      const saleModelMae = Number((saleModelAbsErrorTotal / skuEvaluations.length).toFixed(2));
      const saleNaiveMae = Number((saleNaiveAbsErrorTotal / skuEvaluations.length).toFixed(2));
      const saleMaeImprovementPct =
        saleNaiveMae > 0
          ? Number((((saleNaiveMae - saleModelMae) / saleNaiveMae) * 100).toFixed(2))
          : 0;

      const saleWithinRangePct = Number(
        ((saleWithinRangeCount / skuEvaluations.length) * 100).toFixed(2),
      );

      saleReports.push({
        saleId,
        saleName: targetSale.name,
        startDate: targetSale.startDate,
        endDate: targetSale.endDate,
        durationDays,
        discountPct: targetSale.discountPct,
        plannedSpend: targetSale.plannedSpend || 0,
        evaluatedSkus: skuEvaluations.length,
        actualUnitsTotal: saleActualTotal,
        naiveMae: saleNaiveMae,
        modelMae: saleModelMae,
        maeImprovementPct: saleMaeImprovementPct,
        withinRangePct: saleWithinRangePct,
        evaluations: skuEvaluations,
      });
    }
  }

  // Aggregate Performance across all sales
  const totalEvaluations = allEvaluations.length;
  if (totalEvaluations === 0) {
    return {
      totalSalesBacktested: sortedSales.length,
      evaluatedSalesCount: 0,
      totalEvaluations: 0,
      totalActualUnits: 0,
      naiveMae: 0,
      modelMae: 0,
      maeImprovementPct: 0,
      naiveWapePct: 0,
      modelWapePct: 0,
      wapeImprovementPct: 0,
      withinRangeCount: 0,
      withinRangePct: 0,
      saleReports: [],
    };
  }

  const totalActualUnits = allEvaluations.reduce((sum, e) => sum + e.actualUnits, 0);
  const totalModelAbsError = allEvaluations.reduce((sum, e) => sum + e.modelAbsError, 0);
  const totalNaiveAbsError = allEvaluations.reduce((sum, e) => sum + e.naiveAbsError, 0);
  const totalWithinRangeCount = allEvaluations.filter((e) => e.withinRange).length;

  const naiveMae = Number((totalNaiveAbsError / totalEvaluations).toFixed(2));
  const modelMae = Number((totalModelAbsError / totalEvaluations).toFixed(2));
  const maeImprovementPct =
    naiveMae > 0 ? Number((((naiveMae - modelMae) / naiveMae) * 100).toFixed(2)) : 0;

  const naiveWapePct =
    totalActualUnits > 0 ? Number(((totalNaiveAbsError / totalActualUnits) * 100).toFixed(2)) : 0;
  const modelWapePct =
    totalActualUnits > 0 ? Number(((totalModelAbsError / totalActualUnits) * 100).toFixed(2)) : 0;

  const wapeImprovementPct =
    naiveWapePct > 0
      ? Number((((naiveWapePct - modelWapePct) / naiveWapePct) * 100).toFixed(2))
      : 0;

  const withinRangePct = Number(((totalWithinRangeCount / totalEvaluations) * 100).toFixed(2));

  return {
    totalSalesBacktested: sortedSales.length,
    evaluatedSalesCount: saleReports.length,
    totalEvaluations,
    totalActualUnits,
    naiveMae,
    modelMae,
    maeImprovementPct,
    naiveWapePct,
    modelWapePct,
    wapeImprovementPct,
    withinRangeCount: totalWithinRangeCount,
    withinRangePct,
    saleReports,
  };
}

module.exports = {
  calculateNaiveForecast,
  runTimeOrderedBacktest,
};
