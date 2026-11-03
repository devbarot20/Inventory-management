'use strict';

/**
 * Evaluates stockout risk by comparing demand scenario range against available stock.
 *
 * Mandatory Logic (Section 7):
 * - Low: even the high case fits (unitsAvailable >= high)
 * - Medium: expected fits but high does not (unitsAvailable >= expected && unitsAvailable < high)
 * - High: expected exceeds stock (unitsAvailable < expected)
 * - Include expected run-out time for the high case.
 *
 * @param {Object} params
 * @param {number|null} params.low
 * @param {number|null} params.expected
 * @param {number|null} params.high
 * @param {number|null} params.unitsAvailable - Stock count
 * @param {Date|string} params.startDate - Sale start date
 * @param {number} params.durationDays - Sale duration in days
 *
 * @returns {Object} { riskLevel, expectedRunOutTime, riskReason, stockDeficit }
 */
function evaluateStockoutRisk({
  low,
  expected,
  high,
  unitsAvailable,
  startDate,
  durationDays = 1,
}) {
  if (
    unitsAvailable === null ||
    unitsAvailable === undefined ||
    low === null ||
    expected === null ||
    high === null
  ) {
    return {
      riskLevel: null,
      expectedRunOutTime: null,
      riskReason: 'Insufficient stock or forecast data to determine risk level.',
      stockDeficit: null,
    };
  }

  const startMs = new Date(startDate).getTime();
  const totalSaleMs = durationDays * 24 * 60 * 60 * 1000;

  // 1. Low Risk: Available stock covers even the peak High case
  if (unitsAvailable >= high) {
    return {
      riskLevel: 'low',
      expectedRunOutTime: null, // Never runs out
      riskReason: `Low risk: Available stock (${unitsAvailable}) comfortably covers peak high demand (${high} units).`,
      stockDeficit: 0,
      bufferUnits: unitsAvailable - high,
    };
  }

  // Calculate run-out time in the high case:
  // Assuming demand arrives proportionally over the sale duration
  const fractionOfDuration = high > 0 ? Math.min(1.0, unitsAvailable / high) : 0;
  const runOutMs = Math.round(startMs + fractionOfDuration * totalSaleMs);
  const expectedRunOutTime = new Date(runOutMs);

  // 2. Medium Risk: Expected fits, but High demand exceeds stock
  if (unitsAvailable >= expected && unitsAvailable < high) {
    const highDeficit = high - unitsAvailable;
    return {
      riskLevel: 'medium',
      expectedRunOutTime,
      riskReason: `Medium risk: Stock (${unitsAvailable}) covers expected demand (${expected} units), but high case (${high}) risks stockout by ${expectedRunOutTime.toISOString().slice(0, 16)}Z (${highDeficit} units short).`,
      stockDeficit: highDeficit,
      bufferUnits: unitsAvailable - expected,
    };
  }

  // 3. High Risk: Expected demand already exceeds available stock
  const expectedDeficit = expected - unitsAvailable;
  return {
    riskLevel: 'high',
    expectedRunOutTime,
    riskReason: `High risk: Expected demand (${expected} units) exceeds stock (${unitsAvailable}). Stockout projected by ${expectedRunOutTime.toISOString().slice(0, 16)}Z in high case (${expectedDeficit} units deficit on expected case).`,
    stockDeficit: expectedDeficit,
    bufferUnits: 0,
  };
}

module.exports = {
  evaluateStockoutRisk,
};
