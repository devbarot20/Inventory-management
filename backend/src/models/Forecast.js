'use strict';

const mongoose = require('mongoose');

const { baseSchemaOptions, skuField, unitsField } = require('./common');

const FORECAST_STATUSES = Object.freeze(['ok', 'not_enough_data']);
const RISK_LEVELS = Object.freeze(['low', 'medium', 'high']);

const estimateField = (label) => ({
  type: Number,
  default: null,
  min: [0, `${label} cannot be negative`],
});

/**
 * Forecast for one SKU within a ForecastRun.
 * low / expected / high are estimates of units demanded during the sale, not guarantees.
 */
const forecastSchema = new mongoose.Schema(
  {
    forecastRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForecastRun',
      required: [true, 'Forecast run is required'],
    },
    saleEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaleEvent',
      required: [true, 'Sale event is required'],
    },
    sku: skuField,
    status: {
      type: String,
      enum: { values: FORECAST_STATUSES, message: 'Invalid forecast status' },
      required: true,
    },
    low: estimateField('Low estimate'),
    expected: estimateField('Expected estimate'),
    high: estimateField('High estimate'),
    unitsAvailable: { ...unitsField('Units available', { required: false }), default: null },
    // null when status is "not_enough_data" (enum validation skips null).
    riskLevel: {
      type: String,
      enum: { values: RISK_LEVELS, message: 'Invalid risk level' },
      default: null,
    },
    // When stock would run out in the high-demand case (null if it never runs out).
    expectedRunOutTime: { type: Date, default: null },
    baselineDailyUnits: { type: Number, default: null, min: 0 },
    upliftRatio: { type: Number, default: null, min: 0 },
    similarSalesUsed: { type: Number, default: 0, min: 0 },
    assumptions: { type: [String], default: [] },
    dataQualityFlags: { type: [String], default: [] },
  },
  baseSchemaOptions,
);

forecastSchema.pre('validate', function checkRange() {
  if (this.status === 'ok') {
    for (const field of ['low', 'expected', 'high']) {
      if (this[field] === null || this[field] === undefined) {
        this.invalidate(field, `${field} is required when status is "ok"`);
      }
    }
    if (this.low > this.expected || this.expected > this.high) {
      this.invalidate('expected', 'Estimates must satisfy low <= expected <= high');
    }
  }
});

forecastSchema.index({ forecastRun: 1, sku: 1 }, { unique: true });
forecastSchema.index({ saleEvent: 1, sku: 1 });
forecastSchema.index({ sku: 1 });

module.exports = mongoose.model('Forecast', forecastSchema);
module.exports.FORECAST_STATUSES = FORECAST_STATUSES;
module.exports.RISK_LEVELS = RISK_LEVELS;
