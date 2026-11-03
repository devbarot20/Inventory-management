'use strict';

const { ZodError } = require('zod');
const ApiError = require('../errors/ApiError');
const env = require('../config/env');

// Centralised error handling middleware
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // 1. Known ApiError
  if (err instanceof ApiError) {
    const response = {
      error: {
        message: err.message,
      },
    };
    if (err.details) {
      response.error.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // 2. Zod validation error
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details,
      },
    });
  }

  // 3. Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors).map((field) => ({
      field,
      message: err.errors[field].message,
    }));
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details,
      },
    });
  }

  // 4. Mongo duplicate key error (E11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    const fieldName = fields[0] || 'resource';
    return res.status(409).json({
      error: {
        message: `A record with this ${fieldName} already exists`,
      },
    });
  }

  // 5. JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid authorization token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Authorization token has expired',
      },
    });
  }

  // 6. Bad JSON in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        message: 'Malformed JSON payload in request body',
      },
    });
  }

  // 7. Unhandled / generic server error
  if (!env.isTest) {
    console.error('Unhandled server error:', err);
  }

  return res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}

module.exports = errorHandler;

