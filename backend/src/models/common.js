'use strict';

/**
 * Shared schema building blocks so every model validates SKUs, dates
 * and unit counts the same way.
 */

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]{0,63}$/;

/** Normalises a date-like value to midnight UTC (daily granularity). */
function toUtcDay(value) {
  if (value === null || value === undefined || value === '') return value;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return date; // let the cast/validator reject it
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

const skuField = {
  type: String,
  required: [true, 'SKU is required'],
  trim: true,
  uppercase: true,
  match: [SKU_PATTERN, 'SKU may contain only letters, digits, "-" and "_" (max 64 chars)'],
};

const dayField = {
  type: Date,
  required: [true, 'Date is required'],
  set: toUtcDay,
};

/** Whole, non-negative unit count (e.g. units sold, units in stock). */
function unitsField(label, { required = true } = {}) {
  return {
    type: Number,
    required: required ? [true, `${label} is required`] : false,
    min: [0, `${label} cannot be negative`],
    validate: {
      validator: (v) => v === null || v === undefined || Number.isInteger(v),
      message: `${label} must be a whole number`,
    },
  };
}

/** Non-negative money amount. */
function moneyField(label, { required = false, defaultValue } = {}) {
  const field = {
    type: Number,
    required: required ? [true, `${label} is required`] : false,
    min: [0, `${label} cannot be negative`],
  };
  if (defaultValue !== undefined) field.default = defaultValue;
  return field;
}

/** Discount as a percentage between 0 and 100. */
const discountPctField = {
  type: Number,
  default: 0,
  min: [0, 'Discount cannot be negative'],
  max: [100, 'Discount cannot exceed 100%'],
};

/** Removes internal fields from JSON output. */
function cleanJSON(_doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const baseSchemaOptions = {
  timestamps: true,
  toJSON: { transform: cleanJSON },
  toObject: { transform: cleanJSON },
};

module.exports = {
  SKU_PATTERN,
  toUtcDay,
  skuField,
  dayField,
  unitsField,
  moneyField,
  discountPctField,
  baseSchemaOptions,
};
