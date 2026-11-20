'use strict';

const { User, Product, SaleEvent, ForecastRun, AuditLog } = require('../models');
const { PLAN_IDS } = require('../config/plans');
const ApiError = require('../errors/ApiError');

// Fields to never expose via admin APIs
const SAFE_SELECT = '-password -resetTokenHash -resetTokenExpires -verifyTokenHash -verifyTokenExpires';

/**
 * Record an administrative action for audit and compliance.
 */
async function recordAuditLog({
  adminId,
  adminEmail,
  action,
  targetId = null,
  targetEmail = null,
  details = {},
  ipAddress = null,
  userAgent = null,
}) {
  try {
    return await AuditLog.create({
      adminId,
      adminEmail,
      action,
      targetId,
      targetEmail,
      details,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    // Log error but don't fail the primary request
    console.error('Failed to create audit log entry:', err.message);
    return null;
  }
}

/**
 * List audit logs with pagination and optional action filtering.
 */
async function listAuditLogs({ action, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const filter = {};
  if (action) {
    filter.action = action;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

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
async function updateUserRole(targetId, newRole, requestingAdmin, meta = {}) {
  const requestingAdminId = requestingAdmin?._id || requestingAdmin?.id || requestingAdmin;
  const adminEmail = requestingAdmin?.email || 'admin@system.local';

  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot change their own role');
  }
  if (!['admin', 'user'].includes(newRole)) {
    throw ApiError.badRequest('Invalid role. Must be "admin" or "user"');
  }

  const existing = await User.findById(targetId);
  if (!existing) throw ApiError.notFound('User not found');
  const oldRole = existing.role;

  const user = await User.findByIdAndUpdate(
    targetId,
    { role: newRole },
    { returnDocument: 'after', runValidators: true },
  ).select(SAFE_SELECT);

  await recordAuditLog({
    adminId: requestingAdminId,
    adminEmail,
    action: 'USER_ROLE_CHANGE',
    targetId: user._id,
    targetEmail: user.email,
    details: { oldRole, newRole },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return user;
}

/**
 * Change a user's subscription plan. Admins cannot change their own plan here.
 */
async function updateUserPlan(targetId, newPlan, requestingAdmin, meta = {}) {
  const requestingAdminId = requestingAdmin?._id || requestingAdmin?.id || requestingAdmin;
  const adminEmail = requestingAdmin?.email || 'admin@system.local';

  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot change their own plan via this endpoint. Use /api/auth/plan instead');
  }
  if (!PLAN_IDS.includes(newPlan)) {
    throw ApiError.badRequest(`Invalid plan. Must be one of: ${PLAN_IDS.join(', ')}`);
  }

  const existing = await User.findById(targetId);
  if (!existing) throw ApiError.notFound('User not found');
  const oldPlan = existing.plan;

  const user = await User.findByIdAndUpdate(
    targetId,
    { plan: newPlan },
    { returnDocument: 'after', runValidators: true },
  ).select(SAFE_SELECT);

  await recordAuditLog({
    adminId: requestingAdminId,
    adminEmail,
    action: 'USER_PLAN_CHANGE',
    targetId: user._id,
    targetEmail: user.email,
    details: { oldPlan, newPlan },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return user;
}

/**
 * Soft-delete a user by marking deletedAt. Admins cannot delete themselves.
 */
async function deleteUser(targetId, requestingAdmin, meta = {}) {
  const requestingAdminId = requestingAdmin?._id || requestingAdmin?.id || requestingAdmin;
  const adminEmail = requestingAdmin?.email || 'admin@system.local';

  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot delete their own account via admin panel');
  }

  // Use findById first so we can return 404 if the user doesn't exist
  const user = await User.findById(targetId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.deletedAt) throw ApiError.badRequest('User is already deactivated');

  await User.findByIdAndUpdate(targetId, { deletedAt: new Date() });

  await recordAuditLog({
    adminId: requestingAdminId,
    adminEmail,
    action: 'USER_DEACTIVATED',
    targetId: user._id,
    targetEmail: user.email,
    details: { reason: 'Admin deactivation' },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return { message: 'User deactivated successfully', userId: targetId };
}

/**
 * Platform-wide aggregate stats for the admin dashboard.
 */
async function getPlatformStats() {
  const [
    totalUsers,
    verifiedUsers,
    planBreakdownRaw,
    totalProducts,
    totalCampaigns,
    totalForecasts,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ $or: [{ emailVerificationRequired: { $ne: true } }, { emailVerifiedAt: { $exists: true } }] }),
    User.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    // Product and SaleEvent are scoped per user; count all documents
    Product.countDocuments({}),
    SaleEvent.countDocuments({}),
    ForecastRun.countDocuments({}),
  ]);

  // Convert plan breakdown array to { starter: N, growth: N, scale: N }
  const planBreakdown = PLAN_IDS.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});
  for (const row of planBreakdownRaw) {
    if (row._id && planBreakdown[row._id] !== undefined) {
      planBreakdown[row._id] = row.count;
    }
  }

  return {
    totalUsers,
    verifiedUsers,
    planBreakdown,
    totalProducts,
    totalCampaigns,
    totalForecasts,
  };
}

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserPlan,
  deleteUser,
  getPlatformStats,
  recordAuditLog,
  listAuditLogs,
};
