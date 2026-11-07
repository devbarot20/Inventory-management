'use strict';

const mongoose = require('mongoose');

const { baseSchemaOptions, dayField, skuField, unitsField } = require('./common');

/**
 * Units available for a SKU on a given day.
 * A snapshot with unitsAvailable = 0 marks a stockout day (excluded from the baseline).
 */
const stockSnapshotSchema = new mongoose.Schema(
  {
    sku: skuField,
    date: dayField,
    unitsAvailable: unitsField('Units available'),
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  baseSchemaOptions,
);

stockSnapshotSchema.index({ createdBy: 1, sku: 1, date: 1 }, { unique: true });
stockSnapshotSchema.index({ date: 1 });

module.exports = mongoose.model('StockSnapshot', stockSnapshotSchema);
