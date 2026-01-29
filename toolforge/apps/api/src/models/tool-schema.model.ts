import mongoose, { Schema, Document } from 'mongoose';
import type {
  FieldDefinition,
  ListView,
  FormView,
  ToolAction,
  ToolPermissions,
  AuditConfig,
} from '@toolforge/shared';

export interface IToolSchema extends Document {
  _id: mongoose.Types.ObjectId;
  toolId: string;
  name: string;
  description?: string;
  icon?: string;
  resource: string;
  fields: FieldDefinition[];
  listView: ListView;
  formView: FormView;
  actions?: ToolAction[];
  permissions: ToolPermissions;
  audit: AuditConfig;
  version: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fieldOptionSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const fieldValidationSchema = new Schema(
  {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String,
    patternMessage: String,
    custom: String,
  },
  { _id: false }
);

const fieldPermissionsSchema = new Schema(
  {
    canView: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    canEdit: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
  },
  { _id: false }
);

const fieldDefinitionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    required: Boolean,
    default: Schema.Types.Mixed,
    validation: fieldValidationSchema,
    visibility: String,
    permissions: fieldPermissionsSchema,
    options: [fieldOptionSchema],
    relationTo: String,
    relationLabelField: String,
    computedExpression: String,
    helpText: String,
    placeholder: String,
    readonly: Boolean,
  },
  { _id: false }
);

const listColumnSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    sortable: Boolean,
    width: String,
    format: String,
  },
  { _id: false }
);

const listFilterSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'select', 'multiselect', 'date', 'daterange', 'boolean'],
    },
    options: [fieldOptionSchema],
    operator: {
      type: String,
      enum: ['equals', 'contains', 'in', 'gte', 'lte', 'between'],
    },
  },
  { _id: false }
);

const listViewSchema = new Schema(
  {
    columns: { type: [listColumnSchema], required: true },
    defaultSort: {
      field: String,
      direction: { type: String, enum: ['asc', 'desc'] },
    },
    filters: [listFilterSchema],
    pageSize: { type: Number, default: 20 },
    searchableFields: [String],
  },
  { _id: false }
);

const formSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    fields: { type: [String], required: true },
    visibility: String,
  },
  { _id: false }
);

const formViewSchema = new Schema(
  {
    sections: { type: [formSectionSchema], required: true },
    fieldOrder: [String],
  },
  { _id: false }
);

const toolActionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true, enum: ['row', 'bulk'] },
    icon: String,
    confirmMessage: String,
    handler: { type: String, required: true },
    permissions: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    visibility: String,
  },
  { _id: false }
);

const toolPermissionsSchema = new Schema(
  {
    canAccessTool: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    canCreate: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    canRead: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    canUpdate: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    canDelete: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
    canViewAuditLog: [{ type: String, enum: ['admin', 'manager', 'agent', 'viewer'] }],
  },
  { _id: false }
);

const auditConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    fields: [String],
  },
  { _id: false }
);

const toolSchemaSchema = new Schema<IToolSchema>(
  {
    toolId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    icon: String,
    resource: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    fields: { type: [fieldDefinitionSchema], required: true },
    listView: { type: listViewSchema, required: true },
    formView: { type: formViewSchema, required: true },
    actions: [toolActionSchema],
    permissions: { type: toolPermissionsSchema, required: true },
    audit: { type: auditConfigSchema, required: true },
    version: { type: Number, default: 1 },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

toolSchemaSchema.index({ toolId: 1, version: 1 }, { unique: true });

export const ToolSchema = mongoose.model<IToolSchema>('ToolSchema', toolSchemaSchema);
