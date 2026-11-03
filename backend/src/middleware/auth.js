'use strict';

const ApiError = require('../errors/ApiError');
const { verifyToken } = require('../utils/token');
const { User } = require('../models');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Missing or invalid Authorization header'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Token not provided'));
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role "${req.user.role}" does not have required permissions (${allowedRoles.join(', ')})`,
        ),
      );
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};

