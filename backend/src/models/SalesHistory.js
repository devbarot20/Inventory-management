'use strict';

const mongoose = require('mongoose');

const {
  baseSchemaOptions,
  dayField,
  discountPctField,
  moneyField,
  skuField,
  unitsField,
} = require('./common');

/**
 * One row per SKU per day of historical sales.
 * Whether a day belonged to a past flash sale is derived from SaleEvent date ranges,
 * so it is not duplicated here.
 */
const salesHistorySchema = new mongoose.Schema(
  {
    sku: skuField,
    date: dayField,
    unitsSold: unitsField('Units sold'),
    price: moneyField('Price'),
    discountPct: discountPctField,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  baseSchemaOptions,
);

// One record per SKU per day; also serves "history for a SKU ordered by date" queries.
salesHistorySchema.index({ createdBy: 1, sku: 1, date: 1 }, { unique: true });
salesHistorySchema.index({ date: 1 });

module.exports = mongoose.model('SalesHistory', salesHistorySchema, 'saleshistory');
