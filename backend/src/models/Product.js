'use strict';

const mongoose = require('mongoose');

const { baseSchemaOptions, skuField } = require('./common');

const productSchema = new mongoose.Schema(
  {
    sku: skuField,
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    parentGroup: {
      type: String,
      trim: true,
      maxlength: [100, 'Parent group cannot exceed 100 characters'],
    },
    size: {
      type: String,
      trim: true,
      maxlength: [30, 'Size cannot exceed 30 characters'],
    },
    color: {
      type: String,
      trim: true,
      maxlength: [50, 'Color cannot exceed 50 characters'],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  baseSchemaOptions,
);

// SKUs are unique per owner, so different users can use the same SKU codes.
productSchema.index({ createdBy: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
