'use strict';

const mongoose = require('mongoose');

const { SKU_PATTERN, baseSchemaOptions, discountPctField, moneyField } = require('./common');

/**
 * A flash sale (past or upcoming) with its campaign plan.
 * plannedSpend and actualSpend are deliberately separate: forecasts and backtests
 * may only use plannedSpend, because actualSpend is unknown before the sale.
 */
const saleEventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sale name is required'],
      trim: true,
      maxlength: [200, 'Sale name cannot exceed 200 characters'],
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    discountPct: discountPctField,
    plannedSpend: moneyField('Planned spend', { defaultValue: 0 }),
    actualSpend: moneyField('Actual spend', { defaultValue: null }),
    campaignLabel: {
      type: String,
      trim: true,
      maxlength: [100, 'Campaign label cannot exceed 100 characters'],
      default: '',
    },
    products: {
      type: [
        {
          type: String,
          trim: true,
          uppercase: true,
          match: [SKU_PATTERN, 'Invalid SKU in products list'],
        },
      ],
      default: [],
      validate: {
        validator: (skus) => new Set(skus).size === skus.length,
        message: 'Products list contains duplicate SKUs',
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  baseSchemaOptions,
);

saleEventSchema.pre('validate', function checkDateRange() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after the start date');
  }
});

/** Sale length in (fractional) days, used to find similar past sales. */
saleEventSchema.virtual('durationDays').get(function durationDays() {
  if (!this.startDate || !this.endDate) return null;
  return (this.endDate.getTime() - this.startDate.getTime()) / (24 * 60 * 60 * 1000);
});

saleEventSchema.index({ startDate: 1, endDate: 1 });
saleEventSchema.index({ products: 1 });

module.exports = mongoose.model('SaleEvent', saleEventSchema);
