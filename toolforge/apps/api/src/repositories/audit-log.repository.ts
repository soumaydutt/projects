import mongoose from 'mongoose';
import { AuditLog, type IAuditLog } from '../models/index.js';
import type { Role, AuditActionType, AuditFieldChange } from '@toolforge/shared';

export interface CreateAuditLogInput {
  actorUserId: string;
  actorEmail: string;
  role: Role;
  toolId: string;
  resource: string;
  recordId: string;
  actionType: AuditActionType;
  actionName?: string;
  diff: AuditFieldChange[];
  ip?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  toolId?: string;
  resource?: string;
  recordId?: string;
  actorUserId?: string;
  actionType?: AuditActionType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export class AuditLogRepository {
  async findById(id: string): Promise<IAuditLog | null> {
    return AuditLog.findById(id);
  }

  async findByRecordId(recordId: string): Promise<IAuditLog[]> {
    return AuditLog.find({ recordId }).sort({ timestamp: -1 });
  }

  async query(query: AuditLogQuery): Promise<{ data: IAuditLog[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (query.toolId) filter.toolId = query.toolId;
    if (query.resource) filter.resource = query.resource;
    if (query.recordId) filter.recordId = query.recordId;
    if (query.actorUserId)
      filter.actorUserId = new mongoose.Types.ObjectId(query.actorUserId);
    if (query.actionType) filter.actionType = query.actionType;

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) (filter.timestamp as Record<string, Date>).$gte = query.startDate;
      if (query.endDate) (filter.timestamp as Record<string, Date>).$lte = query.endDate;
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(pageSize),
      AuditLog.countDocuments(filter),
    ]);

    return { data, total };
  }

  async create(input: CreateAuditLogInput): Promise<IAuditLog> {
    const auditLog = new AuditLog({
      actorUserId: new mongoose.Types.ObjectId(input.actorUserId),
      actorEmail: input.actorEmail,
      role: input.role,
      toolId: input.toolId,
      resource: input.resource,
      recordId: input.recordId,
      actionType: input.actionType,
      actionName: input.actionName,
      diff: input.diff,
      ip: input.ip,
      userAgent: input.userAgent,
      timestamp: new Date(),
    });
    return auditLog.save();
  }

  async deleteByRecordId(recordId: string): Promise<number> {
    const result = await AuditLog.deleteMany({ recordId });
    return result.deletedCount;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await AuditLog.deleteMany({ timestamp: { $lt: date } });
    return result.deletedCount;
  }
}

export const auditLogRepository = new AuditLogRepository();
