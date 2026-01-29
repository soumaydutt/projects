import type { Request, Response, NextFunction } from 'express';
import { recordService } from '../services/index.js';
import { getSocketServer } from '../socket/index.js';

export class RecordController {
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId } = req.params;
      const { search, page, pageSize, sort, sortDir, ...filterParams } = req.query;

      // Build filters from query params
      const filters = Object.entries(filterParams)
        .filter(([key]) => !['search', 'page', 'pageSize', 'sort', 'sortDir'].includes(key))
        .map(([field, value]) => ({
          field,
          operator: 'equals' as const,
          value,
        }));

      const result = await recordService.query(toolId, {
        search: search as string,
        filters: filters.length > 0 ? filters : undefined,
        sort: sort
          ? { field: sort as string, direction: (sortDir as 'asc' | 'desc') || 'asc' }
          : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });

      res.json(result);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId, recordId } = req.params;
      const record = await recordService.getById(toolId, recordId);

      if (!record) {
        res.status(404).json({ message: 'Record not found' });
        return;
      }

      res.json(record);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const record = await recordService.create(toolId, req.body, req.user!, ip, userAgent);

      // Emit socket event
      const io = getSocketServer();
      if (io) {
        io.to(`tool:${toolId}`).emit('records:updated', {
          toolId,
          recordId: (record._id as string).toString(),
          actionType: 'created',
          actorId: req.user!._id.toString(),
        });
      }

      res.status(201).json(record);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId, recordId } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const record = await recordService.update(toolId, recordId, req.body, req.user!, ip, userAgent);

      if (!record) {
        res.status(404).json({ message: 'Record not found' });
        return;
      }

      // Emit socket event
      const io = getSocketServer();
      if (io) {
        io.to(`tool:${toolId}`).emit('records:updated', {
          toolId,
          recordId,
          actionType: 'updated',
          actorId: req.user!._id.toString(),
        });
      }

      res.json(record);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId, recordId } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const deleted = await recordService.delete(toolId, recordId, req.user!, ip, userAgent);

      if (!deleted) {
        res.status(404).json({ message: 'Record not found' });
        return;
      }

      // Emit socket event
      const io = getSocketServer();
      if (io) {
        io.to(`tool:${toolId}`).emit('records:updated', {
          toolId,
          recordId,
          actionType: 'deleted',
          actorId: req.user!._id.toString(),
        });
      }

      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async executeAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId, actionId } = req.params;
      const { recordIds, params } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        res.status(400).json({ message: 'recordIds array is required' });
        return;
      }

      const result = await recordService.executeAction(
        toolId,
        actionId,
        recordIds,
        params || {},
        req.user!,
        ip,
        userAgent
      );

      // Emit socket events for affected records
      const io = getSocketServer();
      if (io) {
        for (const recordId of recordIds) {
          io.to(`tool:${toolId}`).emit('records:updated', {
            toolId,
            recordId,
            actionType: 'updated',
            actorId: req.user!._id.toString(),
          });
        }
      }

      res.json(result);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId } = req.params;
      const { recordIds, field, value } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        res.status(400).json({ message: 'recordIds array is required' });
        return;
      }

      if (!field) {
        res.status(400).json({ message: 'field is required' });
        return;
      }

      const result = await recordService.bulkUpdateStatus(
        toolId,
        recordIds,
        field,
        value,
        req.user!,
        ip,
        userAgent
      );

      // Emit socket events
      const io = getSocketServer();
      if (io) {
        for (const recordId of recordIds) {
          io.to(`tool:${toolId}`).emit('records:updated', {
            toolId,
            recordId,
            actionType: 'updated',
            actorId: req.user!._id.toString(),
          });
        }
      }

      res.json(result);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }
}

export const recordController = new RecordController();
