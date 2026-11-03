'use strict';

const mongoose = require('mongoose');

const { baseSchemaOptions } = require('./common');

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
    // Stores a bcrypt hash (hashing is added with authentication in Section 3).
    // Never selected by default so it cannot leak through normal queries.
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

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES = ROLES;
