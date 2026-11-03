'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../errors/ApiError');

/**
 * Helmet security middleware configured for REST API with Next.js frontend.
 */
const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
});

/**
 * General API rate limiter.
 * In development / production: 300 requests per 15 min.
 * In test: 10,000 requests per 15 min.
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 10000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        'Too many requests from this IP, please try again after 15 minutes.',
      ),
    );
  },
});

/**
 * Stricter rate limiter for authentication endpoints (prevent brute-force).
 * In development / production: 30 attempts per 15 min.
 * In test: 10,000 requests per 15 min.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 10000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        'Too many authentication attempts from this IP, please try again after 15 minutes.',
      ),
    );
  },
});

module.exports = {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
};
