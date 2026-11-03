'use strict';

const { parse } = require('csv-parse/sync');
const { Product, SalesHistory, StockSnapshot } = require('../models');
const { SKU_PATTERN, toUtcDay } = require('../models/common');
const ApiError = require('../errors/ApiError');

const VALID_IMPORT_TYPES = Object.freeze(['products', 'sales_history', 'stock_snapshots']);

function validateProductRow(row) {
  const sku = (row.sku || row.SKU || '').trim().toUpperCase();
  const name = (row.name || row.Name || row.product_name || row.productName || '').trim();

  if (!sku) {
    return { valid: false, reason: 'Missing SKU' };
  }
  if (!SKU_PATTERN.test(sku)) {
    return {
      valid: false,
      reason: 'Invalid SKU format (must start with letter/number, max 64 characters)',
    };
  }
  if (!name) {
    return { valid: false, reason: 'Missing product name' };
  }

  return {
    valid: true,
    data: {
      sku,
      name,
    },
  };
}

function validateSalesHistoryRow(row) {
  const sku = (row.sku || row.SKU || '').trim().toUpperCase();
  const rawDate = (row.date || row.Date || '').trim();
  const rawUnits = (row.unitsSold || row.units_sold || row.UnitsSold || row.units || '').trim();
  const rawPrice = (row.price || row.Price || '').trim();
  const rawDiscount = (row.discountPct || row.discount_pct || row.discount || '').trim();

  if (!sku || !SKU_PATTERN.test(sku)) {
    return { valid: false, reason: 'Missing or invalid SKU' };
  }

  if (!rawDate) {
    return { valid: false, reason: 'Missing date' };
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return { valid: false, reason: `Invalid date format: "${rawDate}"` };
  }

  const unitsSold = Number(rawUnits);
  if (rawUnits === '' || Number.isNaN(unitsSold) || !Number.isInteger(unitsSold) || unitsSold < 0) {
    return {
      valid: false,
      reason: `Invalid unitsSold: "${rawUnits}" (cannot be negative; must be a non-negative integer)`,
    };
  }

  let price = null;
  if (rawPrice !== '') {
    price = Number(rawPrice);
    if (Number.isNaN(price) || price < 0) {
      return { valid: false, reason: `Invalid price: "${rawPrice}" (cannot be negative)` };
    }
  }

  let discountPct = 0;
  if (rawDiscount !== '') {
    discountPct = Number(rawDiscount);
    if (Number.isNaN(discountPct) || discountPct < 0 || discountPct > 100) {
      return {
        valid: false,
        reason: `Invalid discountPct: "${rawDiscount}" (must be between 0 and 100)`,
      };
    }
  }

  return {
    valid: true,
    data: {
      sku,
      date: toUtcDay(parsedDate),
      unitsSold,
      price,
      discountPct,
    },
  };
}

function validateStockSnapshotRow(row) {
  const sku = (row.sku || row.SKU || '').trim().toUpperCase();
  const rawDate = (row.date || row.Date || '').trim();
  const rawUnits = (
    row.unitsAvailable ||
    row.units_available ||
    row.UnitsAvailable ||
    row.units ||
    ''
  ).trim();

  if (!sku || !SKU_PATTERN.test(sku)) {
    return { valid: false, reason: 'Missing or invalid SKU' };
  }

  if (!rawDate) {
    return { valid: false, reason: 'Missing date' };
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return { valid: false, reason: `Invalid date format: "${rawDate}"` };
  }

  const unitsAvailable = Number(rawUnits);
  if (
    rawUnits === '' ||
    Number.isNaN(unitsAvailable) ||
    !Number.isInteger(unitsAvailable) ||
    unitsAvailable < 0
  ) {
    return {
      valid: false,
      reason: `Invalid unitsAvailable: "${rawUnits}" (cannot be negative; must be a non-negative integer)`,
    };
  }

  return {
    valid: true,
    data: {
      sku,
      date: toUtcDay(parsedDate),
      unitsAvailable,
    },
  };
}

async function processCsvImport(csvContent, type, userId) {
  if (!VALID_IMPORT_TYPES.includes(type)) {
    throw ApiError.badRequest(
      `Invalid import type "${type}". Allowed types: ${VALID_IMPORT_TYPES.join(', ')}`,
    );
  }

  if (!csvContent || typeof csvContent !== 'string' || !csvContent.trim()) {
    throw ApiError.badRequest('CSV content is empty');
  }

  let records;
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw ApiError.badRequest(`Failed to parse CSV: ${err.message}`);
  }

  if (!records || records.length === 0) {
    throw ApiError.badRequest('CSV contains no data rows');
  }

  const validRows = [];
  const rejectedRows = [];

  for (let i = 0; i < records.length; i++) {
    const rawRow = records[i];
    const rowNumber = i + 2; // Row 1 is header, so data starts at row 2

    let result;
    if (type === 'products') {
      result = validateProductRow(rawRow);
    } else if (type === 'sales_history') {
      result = validateSalesHistoryRow(rawRow);
    } else if (type === 'stock_snapshots') {
      result = validateStockSnapshotRow(rawRow);
    }

    if (result.valid) {
      validRows.push(result.data);
    } else {
      rejectedRows.push({
        row: rowNumber,
        data: rawRow,
        reason: result.reason,
      });
    }
  }

  let insertedOrUpdatedCount = 0;

  if (validRows.length > 0) {
    if (type === 'products') {
      const operations = validRows.map((p) => ({
        updateOne: {
          filter: { sku: p.sku },
          update: {
            $set: { name: p.name },
            $setOnInsert: { sku: p.sku, createdBy: userId || null },
          },
          upsert: true,
        },
      }));
      const writeResult = await Product.bulkWrite(operations, { ordered: false });
      insertedOrUpdatedCount = (writeResult.upsertedCount || 0) + (writeResult.modifiedCount || 0);
    } else if (type === 'sales_history') {
      // Ensure products exist stubs
      const uniqueSkus = [...new Set(validRows.map((r) => r.sku))];
      const productOps = uniqueSkus.map((sku) => ({
        updateOne: {
          filter: { sku },
          update: { $setOnInsert: { sku, name: sku, createdBy: userId || null } },
          upsert: true,
        },
      }));
      await Product.bulkWrite(productOps, { ordered: false });

      const salesOps = validRows.map((s) => ({
        updateOne: {
          filter: { sku: s.sku, date: s.date },
          update: {
            $set: {
              unitsSold: s.unitsSold,
              price: s.price,
              discountPct: s.discountPct,
            },
          },
          upsert: true,
        },
      }));
      const writeResult = await SalesHistory.bulkWrite(salesOps, { ordered: false });
      insertedOrUpdatedCount = (writeResult.upsertedCount || 0) + (writeResult.modifiedCount || 0);
    } else if (type === 'stock_snapshots') {
      // Ensure products exist stubs
      const uniqueSkus = [...new Set(validRows.map((r) => r.sku))];
      const productOps = uniqueSkus.map((sku) => ({
        updateOne: {
          filter: { sku },
          update: { $setOnInsert: { sku, name: sku, createdBy: userId || null } },
          upsert: true,
        },
      }));
      await Product.bulkWrite(productOps, { ordered: false });

      const stockOps = validRows.map((st) => ({
        updateOne: {
          filter: { sku: st.sku, date: st.date },
          update: {
            $set: {
              unitsAvailable: st.unitsAvailable,
            },
          },
          upsert: true,
        },
      }));
      const writeResult = await StockSnapshot.bulkWrite(stockOps, { ordered: false });
      insertedOrUpdatedCount = (writeResult.upsertedCount || 0) + (writeResult.modifiedCount || 0);
    }
  }

  return {
    type,
    totalRows: records.length,
    successCount: validRows.length,
    processedCount: insertedOrUpdatedCount,
    rejectedCount: rejectedRows.length,
    rejectedRows,
  };
}

module.exports = {
  VALID_IMPORT_TYPES,
  processCsvImport,
};
