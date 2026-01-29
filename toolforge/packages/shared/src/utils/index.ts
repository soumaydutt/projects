import type { Role, FieldDefinition, ToolPermissions, ToolAction } from '../types';

// ============= Permission Utilities =============

export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canAccessTool(userRole: Role, permissions: ToolPermissions): boolean {
  return hasPermission(userRole, permissions.canAccessTool);
}

export function canCreate(userRole: Role, permissions: ToolPermissions): boolean {
  return hasPermission(userRole, permissions.canCreate);
}

export function canRead(userRole: Role, permissions: ToolPermissions): boolean {
  return hasPermission(userRole, permissions.canRead);
}

export function canUpdate(userRole: Role, permissions: ToolPermissions): boolean {
  return hasPermission(userRole, permissions.canUpdate);
}

export function canDelete(userRole: Role, permissions: ToolPermissions): boolean {
  return hasPermission(userRole, permissions.canDelete);
}

export function canViewAuditLog(userRole: Role, permissions: ToolPermissions): boolean {
  return hasPermission(userRole, permissions.canViewAuditLog);
}

export function canViewField(userRole: Role, field: FieldDefinition): boolean {
  if (!field.permissions?.canView) return true;
  return hasPermission(userRole, field.permissions.canView);
}

export function canEditField(userRole: Role, field: FieldDefinition): boolean {
  if (field.readonly) return false;
  if (!field.permissions?.canEdit) return true;
  return hasPermission(userRole, field.permissions.canEdit);
}

export function canRunAction(userRole: Role, action: ToolAction): boolean {
  return hasPermission(userRole, action.permissions);
}

// ============= Expression Evaluation =============

export function evaluateVisibility(
  expression: string | undefined,
  record: Record<string, unknown>,
  context: { user?: { role: Role } } = {}
): boolean {
  if (!expression) return true;

  try {
    // Create a safe evaluation context
    const evalFunc = new Function('record', 'user', `return ${expression}`);
    return Boolean(evalFunc(record, context.user));
  } catch {
    console.warn(`Failed to evaluate visibility expression: ${expression}`);
    return true;
  }
}

// ============= Field Utilities =============

export function getFieldByKey(fields: FieldDefinition[], key: string): FieldDefinition | undefined {
  return fields.find((f) => f.key === key);
}

export function getVisibleFields(
  fields: FieldDefinition[],
  userRole: Role,
  record?: Record<string, unknown>
): FieldDefinition[] {
  return fields.filter((field) => {
    if (!canViewField(userRole, field)) return false;
    if (field.visibility && record) {
      return evaluateVisibility(field.visibility, record, { user: { role: userRole } });
    }
    return true;
  });
}

export function getEditableFields(fields: FieldDefinition[], userRole: Role): FieldDefinition[] {
  return fields.filter((field) => canEditField(userRole, field));
}

// ============= Date Utilities =============

export function formatDate(date: string | Date, includeTime = false): string {
  const d = new Date(date);
  if (includeTime) {
    return d.toLocaleString();
  }
  return d.toLocaleDateString();
}

export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============= String Utilities =============

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============= Object Utilities =============

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
}

export function getDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields?: string[]
): Array<{ field: string; before: unknown; after: unknown }> {
  const diff: Array<{ field: string; before: unknown; after: unknown }> = [];
  const keysToCheck = fields || [...new Set([...Object.keys(before), ...Object.keys(after)])];

  for (const key of keysToCheck) {
    if (key.startsWith('_')) continue; // Skip internal fields
    if (!deepEqual(before[key], after[key])) {
      diff.push({
        field: key,
        before: before[key],
        after: after[key],
      });
    }
  }

  return diff;
}

// ============= Query Utilities =============

export function buildMongoFilter(
  filters: Array<{ field: string; operator: string; value: unknown }>
): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = {};

  for (const filter of filters) {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'equals':
        mongoFilter[field] = value;
        break;
      case 'contains':
        mongoFilter[field] = { $regex: value, $options: 'i' };
        break;
      case 'in':
        mongoFilter[field] = { $in: value };
        break;
      case 'gte':
        mongoFilter[field] = { $gte: value };
        break;
      case 'lte':
        mongoFilter[field] = { $lte: value };
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          mongoFilter[field] = { $gte: value[0], $lte: value[1] };
        }
        break;
    }
  }

  return mongoFilter;
}

// ============= Role Hierarchy =============

const roleHierarchy: Record<Role, number> = {
  admin: 4,
  manager: 3,
  agent: 2,
  viewer: 1,
};

export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function getRoleLevel(role: Role): number {
  return roleHierarchy[role];
}
