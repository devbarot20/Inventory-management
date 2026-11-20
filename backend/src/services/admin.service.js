'use strict';

const { User, Product, SaleEvent, ForecastRun, AuditLog } = require('../models');
const { PLAN_IDS } = require('../config/plans');
const ApiError = require('../errors/ApiError');

// Fields to never expose via admin APIs
const SAFE_SELECT = '-password -authVersion -resetTokenHash -resetTokenExpires -verifyTokenHash -verifyTokenExpires';

/**
 * Persist an audit intent before applying the corresponding change. This makes
 * an audit storage outage fail closed instead of allowing an unlogged change.
 */
async function beginAuditEvent({
  adminId,
  adminEmail,
  action,
  targetId = null,
  targetEmail = null,
  details = {},
  ipAddress = null,
  userAgent = null,
}) {
  return AuditLog.create({
    adminId,
    adminEmail,
    action,
    status: 'pending',
    targetId,
    targetEmail,
    details,
    ipAddress,
    userAgent,
  });
}

async function runAuditedMutation(event, mutation) {
  const audit = await beginAuditEvent(event);
  let result;

  try {
    result = await mutation();
    if (result === null || result === undefined) throw ApiError.notFound('User not found');
  } catch (err) {
    try {
      await AuditLog.updateOne({ _id: audit._id, status: 'pending' }, { $set: { status: 'failed' } });
    } catch (auditError) {
      console.error('Failed to finalize admin audit entry:', auditError.message);
    }
    throw err;
  }

  try {
    await AuditLog.updateOne({ _id: audit._id, status: 'pending' }, { $set: { status: 'succeeded' } });
  } catch (err) {
    // The durable intent remains visible as pending if outcome finalization fails.
    console.error('Failed to finalize admin audit entry:', err.message);
  }

  return result;
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
async function listUsers({ search = '', status = 'active', page = 1, limit = 20 } = {}) {
  if (!['active', 'deactivated', 'all'].includes(status)) {
    throw ApiError.badRequest('Status must be active, deactivated, or all');
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;
  const safeSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const filter = {
    ...(status === 'active'
      ? { deletedAt: { $exists: false } }
      : status === 'deactivated'
        ? { deletedAt: { $exists: true } }
        : {}),
    ...(search
      ? {
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ],
      }
      : {}),
  };

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
  if (existing.deletedAt) throw ApiError.notFound('User not found');
  const oldRole = existing.role;

  return runAuditedMutation({
    adminId: requestingAdminId,
    adminEmail,
    action: 'USER_ROLE_CHANGE',
    targetId: existing._id,
    targetEmail: existing.email,
    details: { oldRole, newRole },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  }, async () => User.findOneAndUpdate(
    { _id: targetId, deletedAt: { $exists: false } },
    { role: newRole },
    { returnDocument: 'after', runValidators: true },
  ).select(SAFE_SELECT));
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
  if (existing.deletedAt) throw ApiError.notFound('User not found');
  const oldPlan = existing.plan;

  return runAuditedMutation({
    adminId: requestingAdminId,
    adminEmail,
    action: 'USER_PLAN_CHANGE',
    targetId: existing._id,
    targetEmail: existing.email,
    details: { oldPlan, newPlan },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  }, async () => User.findOneAndUpdate(
    { _id: targetId, deletedAt: { $exists: false } },
    { plan: newPlan },
    { returnDocument: 'after', runValidators: true },
  ).select(SAFE_SELECT));
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

  await runAuditedMutation({
    adminId: requestingAdminId,
    adminEmail,
    action: 'USER_DEACTIVATED',
    targetId: user._id,
    targetEmail: user.email,
    details: { reason: 'Admin deactivation' },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  }, () => User.findOneAndUpdate(
    { _id: targetId, deletedAt: { $exists: false } },
    { $set: { deletedAt: new Date() }, $inc: { authVersion: 1 } },
  ));

  return { message: 'User deactivated successfully', userId: targetId };
}

async function updateUserActivation(targetId, active, requestingAdmin, meta = {}) {
  const requestingAdminId = requestingAdmin?._id || requestingAdmin?.id || requestingAdmin;
  const adminEmail = requestingAdmin?.email || 'admin@system.local';

  if (String(targetId) === String(requestingAdminId)) {
    throw ApiError.forbidden('Admins cannot change their own account activation');
  }

  const user = await User.findById(targetId);
  if (!user) throw ApiError.notFound('User not found');

  if (active && !user.deletedAt) throw ApiError.badRequest('User is already active');
  if (!active && user.deletedAt) throw ApiError.badRequest('User is already deactivated');

  const action = active ? 'USER_REACTIVATED' : 'USER_DEACTIVATED';
  const activationFilter = active
    ? { _id: targetId, deletedAt: { $exists: true } }
    : { _id: targetId, deletedAt: { $exists: false } };
  const update = active
    ? { $unset: { deletedAt: 1 } }
    : { $set: { deletedAt: new Date() }, $inc: { authVersion: 1 } };
  const updatedUser = await runAuditedMutation({
    adminId: requestingAdminId,
    adminEmail,
    action,
    targetId: user._id,
    targetEmail: user.email,
    details: { previousStatus: active ? 'deactivated' : 'active', status: active ? 'active' : 'deactivated' },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  }, () => User.findOneAndUpdate(activationFilter, update, { returnDocument: 'after' }).select(SAFE_SELECT));

  return { message: active ? 'User reactivated successfully' : 'User deactivated successfully', user: updatedUser };
}

/**
 * Platform-wide aggregate stats for the admin dashboard.
 */
async function getPlatformStats() {
  const countForActiveAccounts = async (Model) => {
    const [result] = await Model.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: 'createdBy',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: '$owner' },
      { $match: { 'owner.deletedAt': { $exists: false } } },
      { $count: 'total' },
    ]);
    return result?.total || 0;
  };

  const [
    totalUsers,
    verifiedUsers,
    planBreakdownRaw,
    totalProducts,
    totalCampaigns,
    totalForecasts,
  ] = await Promise.all([
    User.countDocuments({ deletedAt: { $exists: false } }),
    User.countDocuments({
      deletedAt: { $exists: false },
      $or: [{ emailVerificationRequired: { $ne: true } }, { emailVerifiedAt: { $exists: true } }],
    }),
    User.aggregate([
      { $match: { deletedAt: { $exists: false } } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
    countForActiveAccounts(Product),
    countForActiveAccounts(SaleEvent),
    countForActiveAccounts(ForecastRun),
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
  listAuditLogs,
  updateUserActivation,
};
