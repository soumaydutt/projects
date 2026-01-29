import { ToolSchema, type IToolSchema } from '../models/index.js';
import type { ToolSchemaInput } from '@toolforge/shared';

export class ToolSchemaRepository {
  async findById(id: string): Promise<IToolSchema | null> {
    return ToolSchema.findById(id);
  }

  async findByToolId(toolId: string): Promise<IToolSchema | null> {
    return ToolSchema.findOne({ toolId });
  }

  async findPublishedByToolId(toolId: string): Promise<IToolSchema | null> {
    return ToolSchema.findOne({ toolId, isPublished: true });
  }

  async findAll(): Promise<IToolSchema[]> {
    return ToolSchema.find().sort({ name: 1 });
  }

  async findAllPublished(): Promise<IToolSchema[]> {
    return ToolSchema.find({ isPublished: true }).sort({ name: 1 });
  }

  async create(input: ToolSchemaInput): Promise<IToolSchema> {
    const schema = new ToolSchema({
      ...input,
      version: 1,
      isPublished: false,
    });
    return schema.save();
  }

  async update(id: string, input: Partial<ToolSchemaInput>): Promise<IToolSchema | null> {
    return ToolSchema.findByIdAndUpdate(
      id,
      {
        $set: input,
        $inc: { version: 1 },
      },
      { new: true }
    );
  }

  async publish(id: string): Promise<IToolSchema | null> {
    return ToolSchema.findByIdAndUpdate(
      id,
      {
        $set: {
          isPublished: true,
          publishedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  async unpublish(id: string): Promise<IToolSchema | null> {
    return ToolSchema.findByIdAndUpdate(
      id,
      {
        $set: {
          isPublished: false,
        },
        $unset: {
          publishedAt: 1,
        },
      },
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await ToolSchema.findByIdAndDelete(id);
    return result !== null;
  }

  async existsByToolId(toolId: string): Promise<boolean> {
    const count = await ToolSchema.countDocuments({ toolId });
    return count > 0;
  }
}

export const toolSchemaRepository = new ToolSchemaRepository();
