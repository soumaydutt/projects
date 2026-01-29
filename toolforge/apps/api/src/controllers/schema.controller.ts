import type { Request, Response, NextFunction } from 'express';
import { schemaService } from '../services/index.js';

export class SchemaController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Admin sees all schemas, others see only published accessible ones
      let schemas;
      if (req.user?.role === 'admin') {
        schemas = await schemaService.getAll();
      } else {
        schemas = await schemaService.getAccessibleSchemas(req.user!.role);
      }

      res.json({
        data: schemas.map((s) => schemaService.toPublicSchema(s)),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const schema = await schemaService.getById(id);

      if (!schema) {
        res.status(404).json({ message: 'Schema not found' });
        return;
      }

      res.json(schemaService.toPublicSchema(schema));
    } catch (error) {
      next(error);
    }
  }

  async getByToolId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId } = req.params;

      // Non-admin users can only see published schemas
      let schema;
      if (req.user?.role === 'admin') {
        schema = await schemaService.getByToolId(toolId);
      } else {
        schema = await schemaService.getPublishedByToolId(toolId);
      }

      if (!schema) {
        res.status(404).json({ message: 'Schema not found' });
        return;
      }

      res.json(schemaService.toPublicSchema(schema));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = await schemaService.create(req.body);
      res.status(201).json(schemaService.toPublicSchema(schema));
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const schema = await schemaService.update(id, req.body);

      if (!schema) {
        res.status(404).json({ message: 'Schema not found' });
        return;
      }

      res.json(schemaService.toPublicSchema(schema));
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const schema = await schemaService.publish(id);

      if (!schema) {
        res.status(404).json({ message: 'Schema not found' });
        return;
      }

      res.json(schemaService.toPublicSchema(schema));
    } catch (error) {
      if ((error as Error).message.includes('validation failed')) {
        res.status(400).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async unpublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const schema = await schemaService.unpublish(id);

      if (!schema) {
        res.status(404).json({ message: 'Schema not found' });
        return;
      }

      res.json(schemaService.toPublicSchema(schema));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await schemaService.delete(id);

      if (!deleted) {
        res.status(404).json({ message: 'Schema not found' });
        return;
      }

      res.json({ message: 'Schema deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = schemaService.validateSchemaJson(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const schemaController = new SchemaController();
