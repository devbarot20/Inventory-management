'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { baseSchemaOptions } = require('./common');

const { PLAN_IDS, DEFAULT_PLAN } = require('../config/plans');

const ROLES = Object.freeze(['admin', 'user']);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email is too long'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is invalid'],
    },
    // Stores a bcrypt hash. Never selected by default so it cannot leak through normal queries.
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be one of: ' + ROLES.join(', ') },
      default: 'user',
    },
    plan: {
      type: String,
      enum: { values: PLAN_IDS, message: 'Plan must be one of: ' + PLAN_IDS.join(', ') },
      default: DEFAULT_PLAN,
    },
  },
  {
    ...baseSchemaOptions,
    toJSON: {
      transform(doc, ret) {
        baseSchemaOptions.toJSON.transform(doc, ret);
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) {
    throw new Error('Password hash not loaded on user model instance');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES = ROLES;
