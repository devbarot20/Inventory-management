'use strict';

const { User } = require('../models');
const ApiError = require('../errors/ApiError');
const { signToken } = require('../utils/token');
const crypto = require('crypto');
const env = require('../config/env');
const mailer = require('./mailer');

const RESET_TTL_MS = 60 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Creates a fresh verification token, stores only its hash and emails the link. Mail errors never fail the caller. */
async function sendVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString('hex');
  user.verifyTokenHash = hashToken(token);
  user.verifyTokenExpires = new Date(Date.now() + VERIFY_TTL_MS);
  await user.save();

  try {
    await mailer.sendVerification(user.email, user.name, `${env.appUrl}/verify-email?token=${token}`);
  } catch (err) {
    console.error(`Verification email failed: ${err.message}`);
  }
}

async function resendVerification(user) {
  if (user.isEmailVerified) return { alreadyVerified: true };
  await sendVerificationEmail(user);
  return { alreadyVerified: false };
}

async function verifyEmail(token) {
  const user = await User.findOne({
    verifyTokenHash: hashToken(token),
    verifyTokenExpires: { $gt: new Date() },
  }).select('+verifyTokenHash +verifyTokenExpires');
  if (!user) {
    throw ApiError.badRequest('This verification link is invalid or has expired. Request a new one.');
  }
  user.emailVerifiedAt = new Date();
  user.verifyTokenHash = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();
  return user;
}

async function register({ name, email, password, role }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
    emailVerificationRequired: env.emailVerificationEnabled,
  });

  if (env.emailVerificationEnabled) {
    await sendVerificationEmail(user);
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    user,
    token,
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    user: user.toJSON(),
    token,
  };
}

async function changePlan(user, plan) {
  user.plan = plan;
  await user.save();
  return user;
}

async function updateProfile(userId, { name, notificationPreferences }) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name !== undefined) {
    user.name = name.trim();
  }

  if (notificationPreferences !== undefined) {
    user.notificationPreferences = {
      ...(user.notificationPreferences || {}),
      ...notificationPreferences,
    };
  }

  await user.save();
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully' };
}

/** Always resolves the same way so the endpoint cannot be used to discover which emails are registered. */
async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const resetUrl = `${env.appUrl}/reset-password?token=${token}`;
  try {
    await mailer.sendPasswordReset(user.email, user.name, resetUrl);
  } catch (err) {
    console.error(`Password reset email failed: ${err.message}`);
  }
}

async function resetPassword(token, password) {
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpires');
  if (!user) {
    throw ApiError.badRequest('This reset link is invalid or has expired. Request a new one.');
  }

  user.password = password;
  if (user.emailVerificationRequired && !user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date(); // following an emailed link proves the address is theirs
  }
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
}

module.exports = {
  resendVerification,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePlan,
  updateProfile,
  changePassword,
  register,
  login,
};
