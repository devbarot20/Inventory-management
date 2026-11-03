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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  baseSchemaOptions,
);

productSchema.index({ sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
