import type { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/index.js';
import type { AuditActionType } from '@toolforge/shared';

export class AuditController {
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolId } = req.params;
      const {
        resource,
        recordId,
        actorUserId,
        actionType,
        startDate,
        endDate,
        page,
        pageSize,
      } = req.query;

      const result = await auditService.query({
        toolId,
        resource: resource as string,
        recordId: recordId as string,
        actorUserId: actorUserId as string,
        actionType: actionType as AuditActionType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getByRecordId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordId } = req.params;
      const logs = await auditService.getByRecordId(recordId);
      res.json({ data: logs });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const log = await auditService.getById(id);

      if (!log) {
        res.status(404).json({ message: 'Audit log not found' });
        return;
      }

      res.json(log);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
