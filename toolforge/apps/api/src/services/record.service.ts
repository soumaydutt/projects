import { recordRepository, toolSchemaRepository, auditLogRepository } from '../repositories/index.js';
import { createRecordValidator, getDiff } from '@toolforge/shared';
import type { ToolSchema, RecordQueryInput, Role, PaginatedResponse } from '@toolforge/shared';
import type { IToolSchema, IUser } from '../models/index.js';

export class RecordService {
  async getSchema(toolId: string): Promise<IToolSchema | null> {
    return toolSchemaRepository.findPublishedByToolId(toolId);
  }

  async query(
    toolId: string,
    query: RecordQueryInput
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    const result = await recordRepository.query(schema.resource, schema, {
      search: query.search,
      filters: query.filters,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });

    const page = query.page || 1;
    const pageSize = query.pageSize || schema.listView.pageSize || 20;

    return {
      data: result.data,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  async getById(toolId: string, recordId: string): Promise<Record<string, unknown> | null> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    return recordRepository.findById(schema.resource, recordId);
  }

  async create(
    toolId: string,
    data: Record<string, unknown>,
    user: IUser,
    ip?: string,
    userAgent?: string
  ): Promise<Record<string, unknown>> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    // Validate data against schema
    const validator = createRecordValidator(schema.fields);
    const validatedData = validator.parse(data);

    // Apply defaults
    for (const field of schema.fields) {
      if (field.default !== undefined && validatedData[field.key] === undefined) {
        validatedData[field.key] = field.default;
      }
    }

    const record = await recordRepository.create(
      schema.resource,
      validatedData,
      user._id.toString()
    );

    // Create audit log
    if (schema.audit.enabled) {
      await auditLogRepository.create({
        actorUserId: user._id.toString(),
        actorEmail: user.email,
        role: user.role,
        toolId,
        resource: schema.resource,
        recordId: (record._id as string).toString(),
        actionType: 'CREATE',
        diff: Object.entries(validatedData).map(([field, after]) => ({
          field,
          before: undefined,
          after,
        })),
        ip,
        userAgent,
      });
    }

    return record;
  }

  async update(
    toolId: string,
    recordId: string,
    data: Record<string, unknown>,
    user: IUser,
    ip?: string,
    userAgent?: string
  ): Promise<Record<string, unknown> | null> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    // Get existing record for audit
    const existing = await recordRepository.findById(schema.resource, recordId);
    if (!existing) {
      return null;
    }

    // Validate data against schema (partial)
    const validator = createRecordValidator(schema.fields);
    const validatedData = validator.partial().parse(data);

    const record = await recordRepository.update(
      schema.resource,
      recordId,
      validatedData,
      user._id.toString()
    );

    // Create audit log
    if (schema.audit.enabled && record) {
      const auditFields = schema.audit.fields?.length
        ? schema.audit.fields
        : undefined;
      const diff = getDiff(existing, record, auditFields);

      if (diff.length > 0) {
        await auditLogRepository.create({
          actorUserId: user._id.toString(),
          actorEmail: user.email,
          role: user.role,
          toolId,
          resource: schema.resource,
          recordId,
          actionType: 'UPDATE',
          diff,
          ip,
          userAgent,
        });
      }
    }

    return record;
  }

  async delete(
    toolId: string,
    recordId: string,
    user: IUser,
    ip?: string,
    userAgent?: string
  ): Promise<boolean> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    // Get existing record for audit
    const existing = await recordRepository.findById(schema.resource, recordId);
    if (!existing) {
      return false;
    }

    const deleted = await recordRepository.delete(schema.resource, recordId);

    // Create audit log
    if (schema.audit.enabled && deleted) {
      await auditLogRepository.create({
        actorUserId: user._id.toString(),
        actorEmail: user.email,
        role: user.role,
        toolId,
        resource: schema.resource,
        recordId,
        actionType: 'DELETE',
        diff: Object.entries(existing).map(([field, before]) => ({
          field,
          before,
          after: undefined,
        })),
        ip,
        userAgent,
      });
    }

    return deleted;
  }

  async bulkUpdateStatus(
    toolId: string,
    recordIds: string[],
    field: string,
    value: unknown,
    user: IUser,
    ip?: string,
    userAgent?: string
  ): Promise<{ updated: number }> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    // Validate the field exists and value is valid
    const fieldDef = schema.fields.find((f) => f.key === field);
    if (!fieldDef) {
      throw new Error(`Field "${field}" not found in schema`);
    }

    // Get existing records for audit
    const existingRecords: Record<string, Record<string, unknown>> = {};
    if (schema.audit.enabled) {
      for (const id of recordIds) {
        const record = await recordRepository.findById(schema.resource, id);
        if (record) {
          existingRecords[id] = record;
        }
      }
    }

    const updated = await recordRepository.bulkUpdate(
      schema.resource,
      recordIds,
      { [field]: value },
      user._id.toString()
    );

    // Create audit logs
    if (schema.audit.enabled) {
      for (const id of recordIds) {
        const existing = existingRecords[id];
        if (existing && existing[field] !== value) {
          await auditLogRepository.create({
            actorUserId: user._id.toString(),
            actorEmail: user.email,
            role: user.role,
            toolId,
            resource: schema.resource,
            recordId: id,
            actionType: 'UPDATE',
            actionName: `bulk_update_${field}`,
            diff: [{ field, before: existing[field], after: value }],
            ip,
            userAgent,
          });
        }
      }
    }

    return { updated };
  }

  async executeAction(
    toolId: string,
    actionId: string,
    recordIds: string[],
    params: Record<string, unknown>,
    user: IUser,
    ip?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message?: string; affected?: number }> {
    const schema = await this.getSchema(toolId);
    if (!schema) {
      throw new Error(`Tool "${toolId}" not found or not published`);
    }

    const action = schema.actions?.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action "${actionId}" not found`);
    }

    // Handle built-in actions
    switch (action.handler) {
      case 'assignToMe':
        return this.handleAssignToMe(toolId, schema, recordIds, user, ip, userAgent);

      case 'bulkChangeStatus':
        const newStatus = params.status as string;
        if (!newStatus) {
          throw new Error('Status parameter required');
        }
        const result = await this.bulkUpdateStatus(
          toolId,
          recordIds,
          'status',
          newStatus,
          user,
          ip,
          userAgent
        );
        return { success: true, affected: result.updated };

      default:
        throw new Error(`Unknown action handler: ${action.handler}`);
    }
  }

  private async handleAssignToMe(
    toolId: string,
    schema: IToolSchema,
    recordIds: string[],
    user: IUser,
    ip?: string,
    userAgent?: string
  ): Promise<{ success: boolean; affected: number }> {
    const result = await this.bulkUpdateStatus(
      toolId,
      recordIds,
      'assignee',
      user._id.toString(),
      user,
      ip,
      userAgent
    );
    return { success: true, affected: result.updated };
  }
}

export const recordService = new RecordService();
