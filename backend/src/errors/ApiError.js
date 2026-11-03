'use strict';

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required', details = null) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Access denied', details = null) {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Resource already exists', details = null) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;

