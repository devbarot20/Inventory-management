'use strict';

const mongoose = require('mongoose');
const { baseSchemaOptions } = require('./common');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'succeeded',
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  baseSchemaOptions,
);

auditLogSchema.index({ createdAt: -1 });

async function allowPendingOutcomeTransition() {
  const update = this.getUpdate() || {};
  const nextStatus = update.$set?.status ?? update.status;
  if (!['succeeded', 'failed'].includes(nextStatus)) {
    throw new Error('Audit entries may only transition from pending to a final outcome.');
  }

  const current = await this.model.findOne(this.getQuery()).select('status').lean();
  if (!current || current.status !== 'pending') {
    throw new Error('Finalized audit entries are immutable.');
  }
}

auditLogSchema.pre(['updateOne', 'findOneAndUpdate'], allowPendingOutcomeTransition);
auditLogSchema.pre(['deleteOne', 'findOneAndDelete', 'deleteMany'], function preventAuditDeletion() {
  throw new Error('Audit entries cannot be deleted through the application.');
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
