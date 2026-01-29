// Core Types for ToolForge

// ============= User & Auth Types =============
export type Role = 'admin' | 'manager' | 'agent' | 'viewer';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ============= Field Types =============
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'relation'
  | 'json'
  | 'computed';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: string; // Expression for custom validation
}

export interface FieldPermissions {
  canView: Role[];
  canEdit: Role[];
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  validation?: FieldValidation;
  visibility?: string; // Expression like "record.status === 'FAILED'"
  permissions?: FieldPermissions;
  options?: FieldOption[]; // For select/multiselect
  relationTo?: string; // For relation type - toolId to relate to
  relationLabelField?: string; // Field to display for relation
  computedExpression?: string; // For computed fields
  helpText?: string;
  placeholder?: string;
  readonly?: boolean;
}

// ============= List View Types =============
export interface ListColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  format?: string; // Format expression
}

export interface ListFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean';
  options?: FieldOption[];
  operator?: 'equals' | 'contains' | 'in' | 'gte' | 'lte' | 'between';
}

export interface ListView {
  columns: ListColumn[];
  defaultSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: ListFilter[];
  pageSize?: number;
  searchableFields?: string[];
}

// ============= Form View Types =============
export interface FormSection {
  title: string;
  description?: string;
  fields: string[]; // Field keys
  visibility?: string; // Expression for conditional visibility
}

export interface FormView {
  sections: FormSection[];
  fieldOrder?: string[];
}

// ============= Action Types =============
export interface ToolAction {
  id: string;
  label: string;
  type: 'row' | 'bulk';
  icon?: string;
  confirmMessage?: string;
  handler: string; // Action handler identifier
  permissions: Role[];
  visibility?: string; // Expression
}

// ============= Permission Types =============
export interface ToolPermissions {
  canAccessTool: Role[];
  canCreate: Role[];
  canRead: Role[];
  canUpdate: Role[];
  canDelete: Role[];
  canViewAuditLog: Role[];
}

// ============= Audit Types =============
export interface AuditConfig {
  enabled: boolean;
  fields?: string[]; // Fields to audit, empty = all
}

// ============= Tool Schema =============
export interface ToolSchema {
  _id?: string;
  toolId: string;
  name: string;
  description?: string;
  icon?: string;
  resource: string; // Collection name
  fields: FieldDefinition[];
  listView: ListView;
  formView: FormView;
  actions?: ToolAction[];
  permissions: ToolPermissions;
  audit: AuditConfig;
  version: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

// ============= Audit Log Types =============
export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTION';

export interface AuditFieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditLog {
  _id: string;
  actorUserId: string;
  actorEmail: string;
  role: Role;
  toolId: string;
  resource: string;
  recordId: string;
  actionType: AuditActionType;
  actionName?: string; // For custom actions
  diff: AuditFieldChange[];
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

// ============= API Types =============
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface FilterQuery {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'gte' | 'lte' | 'between';
  value: unknown;
}

export interface RecordQuery {
  search?: string;
  filters?: FilterQuery[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

// ============= Socket Events =============
export interface RecordChangeEvent {
  toolId: string;
  recordId: string;
  actionType: 'created' | 'updated' | 'deleted';
  actorId: string;
}

// ============= Generic Record =============
export type DataRecord = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
};
