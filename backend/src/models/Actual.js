'use strict';

const mongoose = require('mongoose');

const { baseSchemaOptions, skuField, unitsField } = require('./common');

/**
 * Actual sales for a SKU after a sale event, plus how the forecast compared.
 * Error measures are computed by the comparison service (Section 9).
 */
const actualSchema = new mongoose.Schema(
  {
    sku: skuField,
    saleEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaleEvent',
      required: [true, 'Sale event is required'],
    },
    // The forecast this actual was compared against (latest run at import time).
    forecast: { type: mongoose.Schema.Types.ObjectId, ref: 'Forecast', default: null },
    actualUnits: unitsField('Actual units'),
    stockoutOccurred: { type: Boolean, default: false },
    errorMeasures: {
      // expected - actual (positive = over-forecast)
      error: { type: Number, default: null },
      absoluteError: { type: Number, default: null, min: 0 },
      withinRange: { type: Boolean, default: null },
      warningCorrect: { type: Boolean, default: null },
      unitsShort: { ...unitsField('Units short', { required: false }), default: null },
      unitsLeftOver: { ...unitsField('Units left over', { required: false }), default: null },
    },
  },
  baseSchemaOptions,
);

actualSchema.index({ saleEvent: 1, sku: 1 }, { unique: true });
actualSchema.index({ sku: 1 });

module.exports = mongoose.model('Actual', actualSchema);
