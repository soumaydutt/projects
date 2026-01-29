import { auditLogRepository, type AuditLogQuery } from '../repositories/index.js';
import type { IAuditLog } from '../models/index.js';
import type { AuditLog, PaginatedResponse } from '@toolforge/shared';

export class AuditService {
  async query(query: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
    const result = await auditLogRepository.query(query);

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    return {
      data: result.data.map(this.toPublicAuditLog),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  async getByRecordId(recordId: string): Promise<AuditLog[]> {
    const logs = await auditLogRepository.findByRecordId(recordId);
    return logs.map(this.toPublicAuditLog);
  }

  async getById(id: string): Promise<AuditLog | null> {
    const log = await auditLogRepository.findById(id);
    return log ? this.toPublicAuditLog(log) : null;
  }

  private toPublicAuditLog(log: IAuditLog): AuditLog {
    return {
      _id: log._id.toString(),
      actorUserId: log.actorUserId.toString(),
      actorEmail: log.actorEmail,
      role: log.role,
      toolId: log.toolId,
      resource: log.resource,
      recordId: log.recordId,
      actionType: log.actionType,
      actionName: log.actionName,
      diff: log.diff,
      timestamp: log.timestamp.toISOString(),
      ip: log.ip,
      userAgent: log.userAgent,
    };
  }
}

export const auditService = new AuditService();
