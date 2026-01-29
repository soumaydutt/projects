import { toolSchemaRepository } from '../repositories/index.js';
import { toolSchemaSchema } from '@toolforge/shared';
import type { ToolSchema, ToolSchemaInput, Role } from '@toolforge/shared';
import type { IToolSchema } from '../models/index.js';
import { canAccessTool } from '@toolforge/shared';

export class SchemaService {
  async getAll(): Promise<IToolSchema[]> {
    return toolSchemaRepository.findAll();
  }

  async getAllPublished(): Promise<IToolSchema[]> {
    return toolSchemaRepository.findAllPublished();
  }

  async getAccessibleSchemas(userRole: Role): Promise<IToolSchema[]> {
    const schemas = await toolSchemaRepository.findAllPublished();
    return schemas.filter((schema) =>
      canAccessTool(userRole, schema.permissions)
    );
  }

  async getById(id: string): Promise<IToolSchema | null> {
    return toolSchemaRepository.findById(id);
  }

  async getByToolId(toolId: string): Promise<IToolSchema | null> {
    return toolSchemaRepository.findByToolId(toolId);
  }

  async getPublishedByToolId(toolId: string): Promise<IToolSchema | null> {
    return toolSchemaRepository.findPublishedByToolId(toolId);
  }

  async create(input: ToolSchemaInput): Promise<IToolSchema> {
    // Validate schema
    const validated = toolSchemaSchema.parse(input);

    // Check if toolId already exists
    const exists = await toolSchemaRepository.existsByToolId(validated.toolId);
    if (exists) {
      throw new Error(`Tool with ID "${validated.toolId}" already exists`);
    }

    return toolSchemaRepository.create(validated);
  }

  async update(id: string, input: Partial<ToolSchemaInput>): Promise<IToolSchema | null> {
    // Partial validation - only validate provided fields
    const existing = await toolSchemaRepository.findById(id);
    if (!existing) {
      throw new Error('Schema not found');
    }

    // If updating toolId, check it doesn't conflict
    if (input.toolId && input.toolId !== existing.toolId) {
      const exists = await toolSchemaRepository.existsByToolId(input.toolId);
      if (exists) {
        throw new Error(`Tool with ID "${input.toolId}" already exists`);
      }
    }

    return toolSchemaRepository.update(id, input);
  }

  async publish(id: string): Promise<IToolSchema | null> {
    const schema = await toolSchemaRepository.findById(id);
    if (!schema) {
      throw new Error('Schema not found');
    }

    // Validate schema before publishing
    try {
      toolSchemaSchema.parse({
        toolId: schema.toolId,
        name: schema.name,
        description: schema.description,
        icon: schema.icon,
        resource: schema.resource,
        fields: schema.fields,
        listView: schema.listView,
        formView: schema.formView,
        actions: schema.actions,
        permissions: schema.permissions,
        audit: schema.audit,
      });
    } catch (error) {
      throw new Error(`Schema validation failed: ${(error as Error).message}`);
    }

    return toolSchemaRepository.publish(id);
  }

  async unpublish(id: string): Promise<IToolSchema | null> {
    return toolSchemaRepository.unpublish(id);
  }

  async delete(id: string): Promise<boolean> {
    return toolSchemaRepository.delete(id);
  }

  validateSchemaJson(input: unknown): { valid: boolean; errors?: string[] } {
    const result = toolSchemaSchema.safeParse(input);
    if (result.success) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  toPublicSchema(schema: IToolSchema): ToolSchema {
    return {
      _id: schema._id.toString(),
      toolId: schema.toolId,
      name: schema.name,
      description: schema.description,
      icon: schema.icon,
      resource: schema.resource,
      fields: schema.fields,
      listView: schema.listView,
      formView: schema.formView,
      actions: schema.actions,
      permissions: schema.permissions,
      audit: schema.audit,
      version: schema.version,
      isPublished: schema.isPublished,
      createdAt: schema.createdAt.toISOString(),
      updatedAt: schema.updatedAt.toISOString(),
      publishedAt: schema.publishedAt?.toISOString(),
    };
  }
}

export const schemaService = new SchemaService();
