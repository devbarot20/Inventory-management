'use strict';

const multer = require('multer');
const importService = require('../services/import.service');
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

async function importCsv(req, res, next) {
  try {
    let csvContent = '';
    const type = req.body.type;

    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
    } else if (req.body.csvText) {
      csvContent = req.body.csvText;
    } else {
      throw ApiError.badRequest('Please upload a CSV file or provide csvText in the request body');
    }

    if (!type) {
      throw ApiError.badRequest(
        'Import "type" is required (products, sales_history, or stock_snapshots)',
      );
    }

    const report = await importService.processCsvImport(csvContent, type, req.user?.id);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  importCsv,
};
