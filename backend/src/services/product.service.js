'use strict';

const { Product, StockSnapshot, SalesHistory } = require('../models');
const ApiError = require('../errors/ApiError');
const { toUtcDay } = require('../models/common');

async function listProducts({ search } = {}) {
  const query = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ sku: regex }, { name: regex }];
  }

  const products = await Product.find(query).sort({ sku: 1 }).lean();

  if (products.length === 0) {
    return [];
  }

  const skus = products.map((p) => p.sku);

  // Fetch the latest stock snapshot for each SKU
  const latestSnapshots = await StockSnapshot.aggregate([
    { $match: { sku: { $in: skus } } },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: '$sku',
        latestDate: { $first: '$date' },
        unitsAvailable: { $first: '$unitsAvailable' },
      },
    },
  ]);

  const stockMap = new Map();
  for (const snap of latestSnapshots) {
    stockMap.set(snap._id, {
      unitsAvailable: snap.unitsAvailable,
      date: snap.latestDate,
    });
  }

  return products.map((p) => ({
    id: p._id.toString(),
    sku: p.sku,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    currentStock: stockMap.get(p.sku) || null,
  }));
}

async function getProductById(id) {
  let product;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(id).lean();
  }
  if (!product) {
    product = await Product.findOne({ sku: id.toUpperCase() }).lean();
  }
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Get stock snapshots history
  const stockHistory = await StockSnapshot.find({ sku: product.sku })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  // Get recent sales history
  const recentSales = await SalesHistory.find({ sku: product.sku })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  return {
    id: product._id.toString(),
    sku: product.sku,
    name: product.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    currentStock: stockHistory[0] ? stockHistory[0].unitsAvailable : null,
    stockHistory: stockHistory.map((s) => ({
      date: s.date,
      unitsAvailable: s.unitsAvailable,
    })),
    recentSales: recentSales.map((s) => ({
      date: s.date,
      unitsSold: s.unitsSold,
      price: s.price,
      discountPct: s.discountPct,
    })),
  };
}

async function createProduct({ sku, name }, userId) {
  const existing = await Product.findOne({ sku: sku.toUpperCase() });
  if (existing) {
    throw ApiError.conflict(`Product with SKU "${sku}" already exists`);
  }

  const product = await Product.create({
    sku: sku.toUpperCase(),
    name,
    createdBy: userId || null,
  });

  return product;
}

async function updateProduct(id, updateData) {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (updateData.sku && updateData.sku !== product.sku) {
    const existing = await Product.findOne({ sku: updateData.sku.toUpperCase() });
    if (existing && existing.id !== product.id) {
      throw ApiError.conflict(`Product with SKU "${updateData.sku}" already exists`);
    }
    product.sku = updateData.sku.toUpperCase();
  }

  if (updateData.name) {
    product.name = updateData.name;
  }

  await product.save();
  return product;
}

async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return { message: 'Product deleted successfully', id: product.id, sku: product.sku };
}

async function recordStock({ sku, date, unitsAvailable }) {
  const normalizedSku = sku.toUpperCase();
  const normalizedDate = toUtcDay(date);

  // Upsert product if doesn't exist
  await Product.updateOne(
    { sku: normalizedSku },
    { $setOnInsert: { sku: normalizedSku, name: normalizedSku } },
    { upsert: true },
  );

  const snapshot = await StockSnapshot.findOneAndUpdate(
    { sku: normalizedSku, date: normalizedDate },
    { $set: { unitsAvailable } },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );

  return snapshot;
}

async function getStockSnapshots(sku) {
  const query = sku ? { sku: sku.toUpperCase() } : {};
  return StockSnapshot.find(query).sort({ date: -1 }).limit(100).lean();
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  recordStock,
  getStockSnapshots,
};
