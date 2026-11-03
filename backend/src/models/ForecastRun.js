'use strict';

const mongoose = require('mongoose');

const { baseSchemaOptions } = require('./common');

const RUN_STATUSES = Object.freeze(['completed', 'failed']);

/**
 * One execution of the forecasting service for a sale event.
 * Stores the inputs and assumptions used so every result is reproducible and explainable.
 */
const forecastRunSchema = new mongoose.Schema(
  {
    saleEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaleEvent',
      required: [true, 'Sale event is required'],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: { values: RUN_STATUSES, message: 'Invalid forecast run status' },
      default: 'completed',
    },
    methodVersion: { type: String, required: true, default: 'baseline-similar-sales-v1' },
    // Snapshot of the sale inputs at run time (the sale event may be edited later).
    inputs: {
      startDate: Date,
      endDate: Date,
      discountPct: Number,
      plannedSpend: Number,
      skus: [String],
    },
    // Config used (e.g. lookback window, similarity tolerances, spend flag).
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    assumptions: { type: [String], default: [] },
    dataQualityFlags: { type: [String], default: [] },
    errorMessage: { type: String, default: null },
  },
  baseSchemaOptions,
);

forecastRunSchema.index({ saleEvent: 1, createdAt: -1 });

module.exports = mongoose.model('ForecastRun', forecastRunSchema);
module.exports.RUN_STATUSES = RUN_STATUSES;
