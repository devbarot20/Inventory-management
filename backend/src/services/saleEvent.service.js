'use strict';

const { SaleEvent, Product, StockSnapshot } = require('../models');
const ApiError = require('../errors/ApiError');

function computeSaleStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'active';
}

function calculateDurationDays(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff * 10) / 10);
}

async function listSaleEvents() {
  const events = await SaleEvent.find().sort({ startDate: -1 }).lean();

  return events.map((event) => {
    const durationDays = calculateDurationDays(event.startDate, event.endDate);
    const status = computeSaleStatus(event.startDate, event.endDate);

    return {
      id: event._id.toString(),
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      durationDays,
      status,
      discountPct: event.discountPct,
      plannedSpend: event.plannedSpend,
      actualSpend: event.actualSpend,
      campaignLabel: event.campaignLabel || '',
      products: event.products || [],
      productCount: (event.products || []).length,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  });
}

async function getSaleEventById(id) {
  const event = await SaleEvent.findById(id).lean();
  if (!event) {
    throw ApiError.notFound('Sale event not found');
  }

  const durationDays = calculateDurationDays(event.startDate, event.endDate);
  const status = computeSaleStatus(event.startDate, event.endDate);

  // Fetch detailed info for linked products
  const products = await Product.find({ sku: { $in: event.products } }).lean();
  const skus = event.products;

  // Latest stock snapshot for each linked SKU
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
    stockMap.set(snap._id, snap.unitsAvailable);
  }

  const productMap = new Map();
  for (const p of products) {
    productMap.set(p.sku, p.name);
  }

  const linkedProductDetails = event.products.map((sku) => ({
    sku,
    name: productMap.get(sku) || sku,
    unitsAvailable: stockMap.has(sku) ? stockMap.get(sku) : null,
  }));

  return {
    id: event._id.toString(),
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    durationDays,
    status,
    discountPct: event.discountPct,
    plannedSpend: event.plannedSpend,
    actualSpend: event.actualSpend,
    campaignLabel: event.campaignLabel || '',
    products: event.products || [],
    productDetails: linkedProductDetails,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

async function createSaleEvent(data, userId) {
  // Normalize dates to Date instances
  const event = await SaleEvent.create({
    name: data.name,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    discountPct: data.discountPct,
    plannedSpend: data.plannedSpend ?? 0,
    actualSpend: data.actualSpend ?? null,
    campaignLabel: data.campaignLabel || '',
    products: data.products || [],
    createdBy: userId || null,
  });

  return getSaleEventById(event.id);
}

async function updateSaleEvent(id, data) {
  const event = await SaleEvent.findById(id);
  if (!event) {
    throw ApiError.notFound('Sale event not found');
  }

  if (data.name !== undefined) event.name = data.name;
  if (data.startDate !== undefined) event.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) event.endDate = new Date(data.endDate);
  if (data.discountPct !== undefined) event.discountPct = data.discountPct;
  if (data.plannedSpend !== undefined) event.plannedSpend = data.plannedSpend;
  if (data.actualSpend !== undefined) event.actualSpend = data.actualSpend;
  if (data.campaignLabel !== undefined) event.campaignLabel = data.campaignLabel;
  if (data.products !== undefined) event.products = data.products;

  await event.save();

  return getSaleEventById(event.id);
}

async function deleteSaleEvent(id) {
  const event = await SaleEvent.findByIdAndDelete(id);
  if (!event) {
    throw ApiError.notFound('Sale event not found');
  }
  return { message: 'Sale event deleted successfully', id: event.id, name: event.name };
}

module.exports = {
  listSaleEvents,
  getSaleEventById,
  createSaleEvent,
  updateSaleEvent,
  deleteSaleEvent,
};

