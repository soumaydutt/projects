import mongoose, { Schema } from 'mongoose';
import type { ToolSchema, FilterQuery } from '@toolforge/shared';
import { buildMongoFilter } from '@toolforge/shared';

// Cache for dynamically created models
const modelCache: Map<string, mongoose.Model<unknown>> = new Map();

function getOrCreateModel(collectionName: string): mongoose.Model<unknown> {
  if (modelCache.has(collectionName)) {
    return modelCache.get(collectionName)!;
  }

  // Check if model already exists in mongoose
  if (mongoose.models[collectionName]) {
    modelCache.set(collectionName, mongoose.models[collectionName]);
    return mongoose.models[collectionName];
  }

  // Create a flexible schema that accepts any data
  const dynamicSchema = new Schema(
    {
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
      timestamps: true,
      strict: false, // Allow any fields
      collection: collectionName,
    }
  );

  const model = mongoose.model(collectionName, dynamicSchema);
  modelCache.set(collectionName, model);
  return model;
}

export interface RecordQueryOptions {
  search?: string;
  filters?: FilterQuery[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

export class RecordRepository {
  private getModel(collectionName: string): mongoose.Model<unknown> {
    return getOrCreateModel(collectionName);
  }

  async findById(
    collectionName: string,
    id: string
  ): Promise<Record<string, unknown> | null> {
    const Model = this.getModel(collectionName);
    const doc = await Model.findById(id).lean();
    return doc as Record<string, unknown> | null;
  }

  async query(
    collectionName: string,
    schema: ToolSchema,
    options: RecordQueryOptions
  ): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const Model = this.getModel(collectionName);

    const filter: Record<string, unknown> = {};

    // Apply filters
    if (options.filters?.length) {
      Object.assign(filter, buildMongoFilter(options.filters));
    }

    // Apply search across searchable fields
    if (options.search && schema.listView.searchableFields?.length) {
      const searchRegex = { $regex: options.search, $options: 'i' };
      filter.$or = schema.listView.searchableFields.map((field) => ({
        [field]: searchRegex,
      }));
    }

    // Build sort
    const sortField = options.sort?.field || schema.listView.defaultSort?.field || 'createdAt';
    const sortDirection = options.sort?.direction || schema.listView.defaultSort?.direction || 'desc';
    const sort: Record<string, 1 | -1> = {
      [sortField]: sortDirection === 'asc' ? 1 : -1,
    };

    // Pagination
    const page = options.page || 1;
    const pageSize = options.pageSize || schema.listView.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
      Model.countDocuments(filter),
    ]);

    return {
      data: data as Record<string, unknown>[],
      total,
    };
  }

  async create(
    collectionName: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<Record<string, unknown>> {
    const Model = this.getModel(collectionName);
    const doc = new Model({
      ...data,
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });
    const saved = await doc.save();
    return saved.toObject() as Record<string, unknown>;
  }

  async update(
    collectionName: string,
    id: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<Record<string, unknown> | null> {
    const Model = this.getModel(collectionName);
    const doc = await Model.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
      },
      { new: true }
    ).lean();
    return doc as Record<string, unknown> | null;
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    const Model = this.getModel(collectionName);
    const result = await Model.findByIdAndDelete(id);
    return result !== null;
  }

  async bulkUpdate(
    collectionName: string,
    ids: string[],
    data: Record<string, unknown>,
    userId: string
  ): Promise<number> {
    const Model = this.getModel(collectionName);
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const result = await Model.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          ...data,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
      }
    );
    return result.modifiedCount;
  }

  async count(collectionName: string, filter: Record<string, unknown> = {}): Promise<number> {
    const Model = this.getModel(collectionName);
    return Model.countDocuments(filter);
  }
}

export const recordRepository = new RecordRepository();
