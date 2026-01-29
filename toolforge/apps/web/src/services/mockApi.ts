import type { User, ToolSchema, AuditLog, PaginatedResponse } from '@toolforge/shared';
import { demoUsers, demoSchemas, sampleTickets, sampleAuditLogs } from './mockData';

// LocalStorage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'tf_current_user',
  USERS: 'tf_users',
  SCHEMAS: 'tf_schemas',
  TICKETS: 'tf_tickets',
  AUDIT_LOGS: 'tf_audit_logs',
};

// Initialize localStorage with demo data
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHEMAS)) {
    localStorage.setItem(STORAGE_KEYS.SCHEMAS, JSON.stringify(demoSchemas));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(sampleTickets));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(sampleAuditLogs));
  }
}

// Initialize on load
initializeStorage();

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to get data from localStorage
function getData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Current user management
let currentUser: User | null = null;

function getCurrentUser(): User | null {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) {
    currentUser = JSON.parse(stored);
  }
  return currentUser;
}

function setCurrentUser(user: User | null): void {
  currentUser = user;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Mock Auth API
export const mockAuthApi = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    await delay(300);
    const users = getData<User & { password: string }>(STORAGE_KEYS.USERS);
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    setCurrentUser(userWithoutPassword);

    return {
      user: userWithoutPassword,
      accessToken: 'mock-access-token-' + Date.now(),
    };
  },

  async logout(): Promise<void> {
    await delay(100);
    setCurrentUser(null);
  },

  async refresh(): Promise<{ user: User; accessToken: string }> {
    await delay(100);
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No session');
    }
    return {
      user,
      accessToken: 'mock-access-token-' + Date.now(),
    };
  },

  async me(): Promise<{ user: User }> {
    await delay(100);
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    return { user };
  },
};

// Mock Schema API
export const mockSchemaApi = {
  async getAll(): Promise<{ data: ToolSchema[] }> {
    await delay(200);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const user = getCurrentUser();

    // Filter by access permissions
    const accessibleSchemas = schemas.filter((schema) => {
      if (!user) return false;
      return schema.permissions.canAccessTool.includes(user.role);
    });

    return { data: accessibleSchemas };
  },

  async getByToolId(toolId: string): Promise<ToolSchema> {
    await delay(100);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const schema = schemas.find((s) => s.toolId === toolId);
    if (!schema) {
      throw new Error('Schema not found');
    }
    return schema;
  },

  async create(schema: Partial<ToolSchema>): Promise<ToolSchema> {
    await delay(200);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const newSchema: ToolSchema = {
      ...schema,
      _id: generateId(),
      version: 1,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ToolSchema;
    schemas.push(newSchema);
    setData(STORAGE_KEYS.SCHEMAS, schemas);
    return newSchema;
  },

  async update(id: string, updates: Partial<ToolSchema>): Promise<ToolSchema> {
    await delay(200);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const index = schemas.findIndex((s) => s._id === id);
    if (index === -1) {
      throw new Error('Schema not found');
    }
    schemas[index] = {
      ...schemas[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: schemas[index].version + 1,
    };
    setData(STORAGE_KEYS.SCHEMAS, schemas);
    return schemas[index];
  },

  async publish(id: string): Promise<ToolSchema> {
    await delay(200);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const index = schemas.findIndex((s) => s._id === id);
    if (index === -1) {
      throw new Error('Schema not found');
    }
    schemas[index].isPublished = true;
    schemas[index].publishedAt = new Date().toISOString();
    setData(STORAGE_KEYS.SCHEMAS, schemas);
    return schemas[index];
  },

  async unpublish(id: string): Promise<ToolSchema> {
    await delay(200);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const index = schemas.findIndex((s) => s._id === id);
    if (index === -1) {
      throw new Error('Schema not found');
    }
    schemas[index].isPublished = false;
    schemas[index].publishedAt = undefined;
    setData(STORAGE_KEYS.SCHEMAS, schemas);
    return schemas[index];
  },

  async delete(id: string): Promise<void> {
    await delay(200);
    const schemas = getData<ToolSchema>(STORAGE_KEYS.SCHEMAS);
    const filtered = schemas.filter((s) => s._id !== id);
    setData(STORAGE_KEYS.SCHEMAS, filtered);
  },

  async validate(_schema: unknown): Promise<{ valid: boolean; errors?: string[] }> {
    await delay(100);
    return { valid: true };
  },
};

// Mock Records API
export const mockRecordsApi = {
  async query(
    toolId: string,
    query: { search?: string; page?: number; pageSize?: number; sort?: { field: string; direction: 'asc' | 'desc' } }
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    await delay(200);

    let records = getData<Record<string, unknown>>(STORAGE_KEYS.TICKETS);

    // Search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      records = records.filter((r) =>
        Object.values(r).some((v) =>
          String(v).toLowerCase().includes(searchLower)
        )
      );
    }

    // Sort
    if (query.sort) {
      const { field, direction } = query.sort;
      records.sort((a, b) => {
        const aVal = String(a[field] || '');
        const bVal = String(b[field] || '');
        const cmp = aVal.localeCompare(bVal);
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    // Paginate
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = records.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedRecords = records.slice(start, start + pageSize);

    return {
      data: paginatedRecords,
      pagination: { page, pageSize, total, totalPages },
    };
  },

  async getById(toolId: string, recordId: string): Promise<Record<string, unknown>> {
    await delay(100);
    const records = getData<Record<string, unknown>>(STORAGE_KEYS.TICKETS);
    const record = records.find((r) => r._id === recordId);
    if (!record) {
      throw new Error('Record not found');
    }
    return record;
  },

  async create(toolId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await delay(200);
    const records = getData<Record<string, unknown>>(STORAGE_KEYS.TICKETS);
    const newRecord = {
      ...data,
      _id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    setData(STORAGE_KEYS.TICKETS, records);

    // Add audit log
    const user = getCurrentUser();
    if (user) {
      const logs = getData<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
      logs.unshift({
        _id: generateId(),
        actorUserId: user._id,
        actorEmail: user.email,
        role: user.role,
        toolId,
        resource: 'tickets',
        recordId: newRecord._id as string,
        actionType: 'CREATE',
        diff: Object.entries(data).map(([field, after]) => ({ field, before: undefined, after })),
        timestamp: new Date().toISOString(),
      });
      setData(STORAGE_KEYS.AUDIT_LOGS, logs);
    }

    return newRecord;
  },

  async update(toolId: string, recordId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await delay(200);
    const records = getData<Record<string, unknown>>(STORAGE_KEYS.TICKETS);
    const index = records.findIndex((r) => r._id === recordId);
    if (index === -1) {
      throw new Error('Record not found');
    }

    const oldRecord = { ...records[index] };
    records[index] = {
      ...records[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setData(STORAGE_KEYS.TICKETS, records);

    // Add audit log
    const user = getCurrentUser();
    if (user) {
      const logs = getData<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
      const diff = Object.entries(data)
        .filter(([key, value]) => oldRecord[key] !== value)
        .map(([field, after]) => ({ field, before: oldRecord[field], after }));

      if (diff.length > 0) {
        logs.unshift({
          _id: generateId(),
          actorUserId: user._id,
          actorEmail: user.email,
          role: user.role,
          toolId,
          resource: 'tickets',
          recordId,
          actionType: 'UPDATE',
          diff,
          timestamp: new Date().toISOString(),
        });
        setData(STORAGE_KEYS.AUDIT_LOGS, logs);
      }
    }

    return records[index];
  },

  async delete(toolId: string, recordId: string): Promise<void> {
    await delay(200);
    const records = getData<Record<string, unknown>>(STORAGE_KEYS.TICKETS);
    const filtered = records.filter((r) => r._id !== recordId);
    setData(STORAGE_KEYS.TICKETS, filtered);

    // Add audit log
    const user = getCurrentUser();
    if (user) {
      const logs = getData<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
      logs.unshift({
        _id: generateId(),
        actorUserId: user._id,
        actorEmail: user.email,
        role: user.role,
        toolId,
        resource: 'tickets',
        recordId,
        actionType: 'DELETE',
        diff: [],
        timestamp: new Date().toISOString(),
      });
      setData(STORAGE_KEYS.AUDIT_LOGS, logs);
    }
  },

  async bulkUpdate(
    toolId: string,
    recordIds: string[],
    field: string,
    value: unknown
  ): Promise<{ updated: number }> {
    await delay(200);
    const records = getData<Record<string, unknown>>(STORAGE_KEYS.TICKETS);
    let updated = 0;

    for (const id of recordIds) {
      const index = records.findIndex((r) => r._id === id);
      if (index !== -1) {
        records[index][field] = value;
        records[index].updatedAt = new Date().toISOString();
        updated++;
      }
    }

    setData(STORAGE_KEYS.TICKETS, records);
    return { updated };
  },

  async executeAction(
    toolId: string,
    actionId: string,
    recordIds: string[],
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; affected?: number }> {
    await delay(200);

    if (actionId === 'assign-to-me') {
      const user = getCurrentUser();
      if (user) {
        const result = await this.bulkUpdate(toolId, recordIds, 'assignee', user.name);
        return { success: true, affected: result.updated };
      }
    }

    if (actionId === 'bulk-change-status' && params?.status) {
      const result = await this.bulkUpdate(toolId, recordIds, 'status', params.status);
      return { success: true, affected: result.updated };
    }

    return { success: true, affected: recordIds.length };
  },
};

// Mock Audit API
export const mockAuditApi = {
  async query(
    toolId: string,
    params: { recordId?: string; page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<AuditLog>> {
    await delay(100);
    let logs = getData<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);

    if (params.recordId) {
      logs = logs.filter((l) => l.recordId === params.recordId);
    }

    logs = logs.filter((l) => l.toolId === toolId);

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = logs.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedLogs = logs.slice(start, start + pageSize);

    return {
      data: paginatedLogs,
      pagination: { page, pageSize, total, totalPages },
    };
  },

  async getByRecordId(toolId: string, recordId: string): Promise<{ data: AuditLog[] }> {
    await delay(100);
    const logs = getData<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
    const filtered = logs.filter((l) => l.recordId === recordId && l.toolId === toolId);
    return { data: filtered };
  },
};

// Mock Users API
export const mockUsersApi = {
  async getAll(): Promise<{ data: User[] }> {
    await delay(100);
    const users = getData<User & { password?: string }>(STORAGE_KEYS.USERS);
    return { data: users.map(({ password, ...u }) => u) };
  },
};
