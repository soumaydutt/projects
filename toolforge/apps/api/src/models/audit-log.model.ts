import mongoose, { Schema, Document } from 'mongoose';
import type { Role, AuditActionType, AuditFieldChange } from '@toolforge/shared';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  actorEmail: string;
  role: Role;
  toolId: string;
  resource: string;
  recordId: string;
  actionType: AuditActionType;
  actionName?: string;
  diff: AuditFieldChange[];
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

const auditFieldChangeSchema = new Schema(
  {
    field: { type: String, required: true },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
  },
  { _id: false }
);

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'manager', 'agent', 'viewer'],
    },
    toolId: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    recordId: {
      type: String,
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'ACTION'],
    },
    actionName: String,
    diff: [auditFieldChangeSchema],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: String,
    userAgent: String,
  },
  {
    timestamps: false,
  }
);

// Compound indexes for common queries
auditLogSchema.index({ toolId: 1, timestamp: -1 });
auditLogSchema.index({ recordId: 1, timestamp: -1 });
auditLogSchema.index({ actorUserId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
