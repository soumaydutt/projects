import { z } from 'zod';

// ============= Auth Validation =============
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'agent', 'viewer']).default('viewer'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============= Role Validation =============
export const roleSchema = z.enum(['admin', 'manager', 'agent', 'viewer']);

// ============= Field Type Validation =============
export const fieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'boolean',
  'select',
  'multiselect',
  'date',
  'datetime',
  'relation',
  'json',
  'computed',
]);

// ============= Field Option Validation =============
export const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

// ============= Field Validation Schema =============
export const fieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
  custom: z.string().optional(),
});

// ============= Field Permissions Schema =============
export const fieldPermissionsSchema = z.object({
  canView: z.array(roleSchema),
  canEdit: z.array(roleSchema),
});

// ============= Field Definition Schema =============
export const fieldDefinitionSchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid field key'),
  label: z.string().min(1),
  type: fieldTypeSchema,
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  validation: fieldValidationSchema.optional(),
  visibility: z.string().optional(),
  permissions: fieldPermissionsSchema.optional(),
  options: z.array(fieldOptionSchema).optional(),
  relationTo: z.string().optional(),
  relationLabelField: z.string().optional(),
  computedExpression: z.string().optional(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  readonly: z.boolean().optional(),
});

// ============= List View Schema =============
export const listColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().optional(),
  width: z.string().optional(),
  format: z.string().optional(),
});

export const listFilterSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'select', 'multiselect', 'date', 'daterange', 'boolean']),
  options: z.array(fieldOptionSchema).optional(),
  operator: z.enum(['equals', 'contains', 'in', 'gte', 'lte', 'between']).optional(),
});

export const listViewSchema = z.object({
  columns: z.array(listColumnSchema).min(1),
  defaultSort: z
    .object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  filters: z.array(listFilterSchema).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  searchableFields: z.array(z.string()).optional(),
});

// ============= Form View Schema =============
export const formSectionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(z.string()).min(1),
  visibility: z.string().optional(),
});

export const formViewSchema = z.object({
  sections: z.array(formSectionSchema).min(1),
  fieldOrder: z.array(z.string()).optional(),
});

// ============= Action Schema =============
export const toolActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['row', 'bulk']),
  icon: z.string().optional(),
  confirmMessage: z.string().optional(),
  handler: z.string(),
  permissions: z.array(roleSchema),
  visibility: z.string().optional(),
});

// ============= Permissions Schema =============
export const toolPermissionsSchema = z.object({
  canAccessTool: z.array(roleSchema),
  canCreate: z.array(roleSchema),
  canRead: z.array(roleSchema),
  canUpdate: z.array(roleSchema),
  canDelete: z.array(roleSchema),
  canViewAuditLog: z.array(roleSchema),
});

// ============= Audit Config Schema =============
export const auditConfigSchema = z.object({
  enabled: z.boolean(),
  fields: z.array(z.string()).optional(),
});

// ============= Tool Schema Validation =============
export const toolSchemaSchema = z.object({
  toolId: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, 'Tool ID must be lowercase with hyphens'),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  resource: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, 'Resource must be lowercase with underscores'),
  fields: z.array(fieldDefinitionSchema).min(1),
  listView: listViewSchema,
  formView: formViewSchema,
  actions: z.array(toolActionSchema).optional(),
  permissions: toolPermissionsSchema,
  audit: auditConfigSchema,
});

export const createToolSchemaSchema = toolSchemaSchema;
export const updateToolSchemaSchema = toolSchemaSchema.partial();

// ============= Record Query Validation =============
export const filterQuerySchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'contains', 'in', 'gte', 'lte', 'between']),
  value: z.unknown(),
});

export const recordQuerySchema = z.object({
  search: z.string().optional(),
  filters: z.array(filterQuerySchema).optional(),
  sort: z
    .object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});

// ============= Dynamic Record Validation =============
import type { FieldDefinition } from '../types';

export function createRecordValidator(fields: FieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.readonly || field.type === 'computed') continue;

    let validator: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        validator = z.string();
        if (field.validation?.minLength) {
          validator = (validator as z.ZodString).min(field.validation.minLength);
        }
        if (field.validation?.maxLength) {
          validator = (validator as z.ZodString).max(field.validation.maxLength);
        }
        if (field.validation?.pattern) {
          validator = (validator as z.ZodString).regex(
            new RegExp(field.validation.pattern),
            field.validation.patternMessage
          );
        }
        break;

      case 'number':
        validator = z.number();
        if (field.validation?.min !== undefined) {
          validator = (validator as z.ZodNumber).min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          validator = (validator as z.ZodNumber).max(field.validation.max);
        }
        break;

      case 'boolean':
        validator = z.boolean();
        break;

      case 'select':
        if (field.options?.length) {
          validator = z.enum(field.options.map((o) => o.value) as [string, ...string[]]);
        } else {
          validator = z.string();
        }
        break;

      case 'multiselect':
        if (field.options?.length) {
          validator = z.array(z.enum(field.options.map((o) => o.value) as [string, ...string[]]));
        } else {
          validator = z.array(z.string());
        }
        break;

      case 'date':
      case 'datetime':
        validator = z.string().datetime().or(z.string().date());
        break;

      case 'relation':
        validator = z.string(); // ObjectId as string
        break;

      case 'json':
        validator = z.unknown();
        break;

      default:
        validator = z.unknown();
    }

    if (!field.required) {
      validator = validator.optional().nullable();
    }

    shape[field.key] = validator;
  }

  return z.object(shape).passthrough();
}

// Export types from zod schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ToolSchemaInput = z.infer<typeof toolSchemaSchema>;
export type RecordQueryInput = z.infer<typeof recordQuerySchema>;
