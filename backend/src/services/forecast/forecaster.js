'use strict';

const { calculateBaseline } = require('./baseline');
const { findSimilarSalesAndUplift, getDurationInDays } = require('./similarSales');
const { applyOptionalSpendAdjustment } = require('./spendAdjustment');

/**
 * Generates demand forecast for a single SKU for an upcoming sale event.
 *
 * @param {Object} params
 * @param {string} params.sku
 * @param {Object} params.targetSale - { startDate, endDate, discountPct, plannedSpend }
 * @param {Array} params.salesHistory - historical sales for this SKU
 * @param {Array} params.stockSnapshots - historical stock snapshots for this SKU
 * @param {Array} params.pastSales - earlier sales
 * @param {Object} [params.config] - configuration flags
 * @param {boolean} [params.config.enableSpendAdjustment=false] - optional spend elasticity flag (off by default)
 */
function forecastProductDemand({
  sku,
  targetSale,
  salesHistory = [],
  stockSnapshots = [],
  pastSales = [],
  config = {},
}) {
  const allAssumptions = [
    'Forecast is an estimate derived from historical sales and assumptions; not a guarantee.',
  ];
  const allDataQualityFlags = [];

  const durationDays = getDurationInDays(targetSale.startDate, targetSale.endDate);

  // 1. Calculate Baseline from normal days (excluding sales & stockouts)
  const baselineResult = calculateBaseline({
    sku,
    beforeDate: targetSale.startDate,
    salesHistory,
    stockSnapshots,
    saleEvents: pastSales,
    config,
  });

  // 4. If product has too little history, return "not enough data"
  if (!baselineResult.hasEnoughData || baselineResult.baselineDailyUnits === null) {
    allAssumptions.push('Product has insufficient normal sales days in recent history.');
    allDataQualityFlags.push('not_enough_history');

    return {
      sku,
      status: 'not_enough_data',
      reason: baselineResult.reason || 'Insufficient sales history to compute baseline',
      low: null,
      expected: null,
      high: null,
      baselineDailyUnits: null,
      upliftRatio: null,
      durationDays,
      similarSalesUsed: 0,
      assumptions: allAssumptions,
      dataQualityFlags: allDataQualityFlags,
    };
  }

  const baselineDailyUnits = baselineResult.baselineDailyUnits;
  allAssumptions.push(
    `Baseline demand is ${baselineDailyUnits} units/day calculated from ${baselineResult.normalDaysCount} normal sales days (excluding ${baselineResult.excludedSaleDays} sale days and ${baselineResult.excludedStockoutDays} stockout days).`,
  );

  // 2 & 3. Find similar past sales & calculate uplift spread (handling stockouts)
  const similarResult = findSimilarSalesAndUplift({
    sku,
    targetSale,
    pastSales,
    salesHistory,
    stockSnapshots,
    config,
  });

  allAssumptions.push(...similarResult.assumptions);
  allDataQualityFlags.push(...similarResult.dataQualityFlags);

  let upliftSummary = similarResult.upliftSummary;

  // 5. Optional spend scenario adjustment (OFF by default)
  const spendResult = applyOptionalSpendAdjustment({
    upliftSummary,
    targetPlannedSpend: targetSale.plannedSpend || 0,
    similarSales: similarResult.similarSalesFound,
    enabled: config.enableSpendAdjustment === true,
  });

  upliftSummary = spendResult.upliftSummary;
  allAssumptions.push(...spendResult.assumptions);

  // Calculate demand totals across the sale duration
  const rawLow = baselineDailyUnits * upliftSummary.low * durationDays;
  const rawExpected = baselineDailyUnits * upliftSummary.expected * durationDays;
  const rawHigh = baselineDailyUnits * upliftSummary.high * durationDays;

  // Enforce integer unit counts and strict ordering: 0 <= low <= expected <= high
  const low = Math.max(0, Math.round(rawLow));
  const expected = Math.max(low, Math.round(rawExpected));
  const high = Math.max(expected, Math.round(rawHigh));

  return {
    sku,
    status: 'ok',
    low,
    expected,
    high,
    baselineDailyUnits,
    upliftRatio: upliftSummary.expected,
    upliftRange: {
      low: upliftSummary.low,
      expected: upliftSummary.expected,
      high: upliftSummary.high,
    },
    durationDays,
    similarSalesUsed: upliftSummary.similarCount,
    similarSalesDetails: similarResult.similarSalesFound,
    assumptions: allAssumptions,
    dataQualityFlags: allDataQualityFlags,
  };
}

/**
 * Runs forecast across all linked products of a sale event.
 */
function forecastSaleEventDemand({
  saleEvent,
  salesHistoryBySku = {},
  stockSnapshotsBySku = {},
  pastSales = [],
  config = {},
}) {
  const skus = saleEvent.products || [];
  const forecasts = [];

  for (const sku of skus) {
    const skuSales = salesHistoryBySku[sku] || [];
    const skuStock = stockSnapshotsBySku[sku] || [];

    const result = forecastProductDemand({
      sku,
      targetSale: saleEvent,
      salesHistory: skuSales,
      stockSnapshots: skuStock,
      pastSales,
      config,
    });

    forecasts.push(result);
  }

  return {
    saleEventId: saleEvent.id || saleEvent._id,
    forecasts,
    runAt: new Date().toISOString(),
    configUsed: config,
  };
}

module.exports = {
  forecastProductDemand,
  forecastSaleEventDemand,
};
