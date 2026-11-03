'use strict';

const { User } = require('../models');
const ApiError = require('../errors/ApiError');
const { signToken } = require('../utils/token');

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
  });

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

module.exports = {
  register,
  login,
};
