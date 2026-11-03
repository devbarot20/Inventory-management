'use strict';

/**
 * Optional ad spend scenario testing.
 *
 * Mandatory constraint from prompt:
 * "Do NOT claim ad spend causes sales. Show forecasts as estimates with assumptions.
 * Optional step, behind a config flag and OFF by default: test whether planned spend improves the forecast."
 *
 * @param {Object} params
 * @param {Object} params.upliftSummary - { low, expected, high, similarCount }
 * @param {number} params.targetPlannedSpend - Planned spend for upcoming flash sale
 * @param {Array} params.similarSales - Array of past similar sales
 * @param {boolean} [params.enabled=false] - Config flag, OFF by default
 *
 * @returns {Object} { adjustedUplifts, assumptions, spendRatio }
 */
function applyOptionalSpendAdjustment({
  upliftSummary,
  targetPlannedSpend = 0,
  similarSales = [],
  enabled = false,
}) {
  const assumptions = [];

  // Default: Spend adjustment is OFF
  if (!enabled || targetPlannedSpend <= 0) {
    if (targetPlannedSpend > 0) {
      assumptions.push(
        `Planned TikTok influencer spend of $${targetPlannedSpend.toLocaleString()} is noted as an input scenario; spend-based volume elasticity is disabled (off by default).`,
      );
    } else {
      assumptions.push('No influencer spend planned for this sale ($0).');
    }

    return {
      upliftSummary,
      assumptions,
      applied: false,
    };
  }

  // If enabled: test whether planned spend differs from past campaigns
  const pastSpends = similarSales
    .map((s) => s.plannedSpend)
    .filter((sp) => typeof sp === 'number' && sp > 0);

  const avgPastSpend =
    pastSpends.length > 0
      ? pastSpends.reduce((a, b) => a + b, 0) / pastSpends.length
      : targetPlannedSpend; // fallback

  // Diminishing returns factor using log scaling
  const spendRatio = avgPastSpend > 0 ? targetPlannedSpend / avgPastSpend : 1.0;
  // Subtle elasticity capped between 0.85 and 1.35
  const elasticityFactor = Math.min(1.35, Math.max(0.85, 1.0 + 0.12 * Math.log(spendRatio)));

  const adjustedUplifts = {
    low: Math.round(upliftSummary.low * elasticityFactor * 100) / 100,
    expected: Math.round(upliftSummary.expected * elasticityFactor * 100) / 100,
    high: Math.round(upliftSummary.high * elasticityFactor * 100) / 100,
    similarCount: upliftSummary.similarCount,
  };

  assumptions.push(
    `[EXPERIMENTAL] Optional spend elasticity adjustment applied (${elasticityFactor.toFixed(2)}x factor based on $${targetPlannedSpend.toLocaleString()} planned spend vs. $${Math.round(avgPastSpend).toLocaleString()} benchmark).`,
  );
  assumptions.push(
    'Disclaimer: Ad spend does not guarantee or cause sales. This adjustment is an experimental scenario assumption.',
  );

  return {
    upliftSummary: adjustedUplifts,
    assumptions,
    applied: true,
    spendRatio: Math.round(spendRatio * 100) / 100,
    elasticityFactor: Math.round(elasticityFactor * 100) / 100,
  };
}

module.exports = {
  applyOptionalSpendAdjustment,
};
