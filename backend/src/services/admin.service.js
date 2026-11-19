'use strict';

const { User } = require('../models');
const { PLAN_IDS } = require('../config/plans');
const ApiError = require('../errors/ApiError');

// Fields to never expose via admin APIs
const SAFE_SELECT = '-password -resetTokenHash -resetTokenExpires -verifyTokenHash -verifyTokenExpires';

/**
 * List all users with optional search and pagination.
 * @param {object} opts
 * @param {string} [opts.search]  - Partial match on name or email (case-insensitive)
 * @param {number} [opts.page]   - 1-based page number (default 1)
 * @param {number} [opts.limit]  - Page size, max 100 (default 20)
 * @returns {{ users: User[], total: number, page: number, totalPages: number }}
 */
async function listUsers({ search = '', page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).select(SAFE_SELECT).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * Get a single user by id.
 */
async function getUserById(id) {
  const user = await User.findById(id).select(SAFE_SELECT);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/**
 * Change a user's role. Admins cannot change their own role.
 */
async function updateUserRole(targetId, newRole, requestingAdminId) {
  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot change their own role');
  }
  if (!['admin', 'user'].includes(newRole)) {
    throw ApiError.badRequest('Invalid role. Must be "admin" or "user"');
  }

  const user = await User.findByIdAndUpdate(
    targetId,
    { role: newRole },
    { new: true, runValidators: true },
  ).select(SAFE_SELECT);

  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/**
 * Change a user's subscription plan. Admins cannot change their own plan here.
 */
async function updateUserPlan(targetId, newPlan, requestingAdminId) {
  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot change their own plan via this endpoint. Use /api/auth/plan instead');
  }
  if (!PLAN_IDS.includes(newPlan)) {
    throw ApiError.badRequest(`Invalid plan. Must be one of: ${PLAN_IDS.join(', ')}`);
  }

  const user = await User.findByIdAndUpdate(
    targetId,
    { plan: newPlan },
    { new: true, runValidators: true },
  ).select(SAFE_SELECT);

  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/**
 * Soft-delete a user by marking deletedAt. Admins cannot delete themselves.
 * Note: We add a `deletedAt` field dynamically — Mongoose will store it as an unschema'd key
 * (works fine with strict: false override or we set strict option per update call).
 */
async function deleteUser(targetId, requestingAdminId) {
  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot delete their own account via admin panel');
  }

  // Use findById first so we can return 404 if the user doesn't exist
  const user = await User.findById(targetId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.deletedAt) throw ApiError.badRequest('User is already deactivated');

  await User.findByIdAndUpdate(targetId, { deletedAt: new Date() }, { strict: false });

  return { message: 'User deactivated successfully', userId: targetId };
}

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserPlan,
  deleteUser,
};
