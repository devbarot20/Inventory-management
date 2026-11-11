'use strict';

const multer = require('multer');
const { parse } = require('csv-parse/sync');
const comparisonService = require('../services/comparison.service');
const { Actual, SaleEvent } = require('../models');
const { findOwnedSaleEvent } = require('../utils/ownership');
const { SKU_PATTERN } = require('../models/common');
const ApiError = require('../errors/ApiError');

// Memory storage for CSV uploads (up to 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv') ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Only CSV files are allowed'));
    }
  },
});

async function recordActualsJson(req, res, next) {
  try {
    const { saleEventId } = req.params;
    const { items, actualSpend } = req.body;

    const result = await comparisonService.recordActuals({
      saleEventId,
      actualRecords: items,
      actualSpend,
      userId: req.user.id,
    });

    res.status(200).json({
      message: 'Actuals recorded and evaluated successfully',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function importActualsCsv(req, res, next) {
  try {
    const { saleEventId } = req.params;
    let csvContent = '';

    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
    } else if (req.body.csvText) {
      csvContent = req.body.csvText;
    } else {
      throw ApiError.badRequest('Please upload a CSV file or provide csvText in the request body');
    }

    let records = [];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      throw ApiError.badRequest(`Failed to parse CSV: ${parseErr.message}`);
    }

    if (records.length === 0) {
      throw ApiError.badRequest('CSV contains no data rows');
    }

    const items = [];
    const errors = [];

    records.forEach((row, idx) => {
      const rowNum = idx + 2; // account for 1-based index and header row
      const sku = (row.sku || row.SKU || '').trim().toUpperCase();
      const rawUnits = (
        row.actualUnits ||
        row.actual_units ||
        row.unitsSold ||
        row.units_sold ||
        row.units ||
        ''
      ).trim();
      const rawStockout = (
        row.stockoutOccurred ||
        row.stockout_occurred ||
        row.stockout ||
        row.Stockout ||
        ''
      )
        .trim()
        .toLowerCase();

      if (!sku) {
        errors.push({ row: rowNum, reason: 'Missing SKU' });
        return;
      }
      if (!SKU_PATTERN.test(sku)) {
        errors.push({ row: rowNum, reason: `Invalid SKU format: ${sku}` });
        return;
      }

      const actualUnits = Number(rawUnits);
      if (
        rawUnits === '' ||
        isNaN(actualUnits) ||
        actualUnits < 0 ||
        !Number.isInteger(actualUnits)
      ) {
        errors.push({
          row: rowNum,
          reason: `Invalid actualUnits: "${rawUnits}" (must be whole non-negative integer)`,
        });
        return;
      }

      const stockoutOccurred =
        rawStockout === 'true' ||
        rawStockout === 'yes' ||
        rawStockout === '1' ||
        rawStockout === 'y';

      items.push({
        sku,
        actualUnits,
        stockoutOccurred,
      });
    });

    if (errors.length > 0 && items.length === 0) {
      return res.status(400).json({
        message: 'CSV validation failed',
        totalRows: records.length,
        validRows: 0,
        errors,
      });
    }

    const actualSpend = req.body.actualSpend !== undefined ? req.body.actualSpend : undefined;

    const result = await comparisonService.recordActuals({
      saleEventId,
      actualRecords: items,
      actualSpend,
      userId: req.user.id,
    });

    res.status(200).json({
      message: 'Actuals CSV imported and evaluated successfully',
      totalRows: records.length,
      importedCount: items.length,
      rowErrors: errors,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function getComparison(req, res, next) {
  try {
    const { saleEventId } = req.params;
    const result = await comparisonService.getComparison(saleEventId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getActuals(req, res, next) {
  try {
    const { saleEventId } = req.params;
    await findOwnedSaleEvent(SaleEvent, saleEventId, req.user.id, { lean: true });
    const actuals = await Actual.find({ saleEvent: saleEventId }).lean();
    res.status(200).json({ actuals });
  } catch (err) {
    next(err);
  }
}

async function deleteActualSku(req, res, next) {
  try {
    const { saleEventId, sku } = req.params;
    const result = await comparisonService.deleteActualSku(saleEventId, sku, req.user.id);
    res.status(200).json({
      message: `Actual for SKU ${sku.toUpperCase()} deleted`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function clearActuals(req, res, next) {
  try {
    const { saleEventId } = req.params;
    const result = await comparisonService.clearActuals(saleEventId, req.user.id);
    res.status(200).json({
      message: 'All recorded actuals cleared for this sale event',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  recordActualsJson,
  importActualsCsv,
  getComparison,
  getActuals,
  deleteActualSku,
  clearActuals,
};
