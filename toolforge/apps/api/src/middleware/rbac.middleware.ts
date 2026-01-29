import type { Request, Response, NextFunction } from 'express';
import { schemaService } from '../services/index.js';
import {
  canAccessTool,
  canCreate,
  canRead,
  canUpdate,
  canDelete,
  canViewAuditLog,
  canRunAction,
} from '@toolforge/shared';

// Middleware to check if user can access a tool
export async function checkToolAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { toolId } = req.params;
    if (!toolId) {
      res.status(400).json({ message: 'Tool ID is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const schema = await schemaService.getPublishedByToolId(toolId);
    if (!schema) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    if (!canAccessTool(req.user.role, schema.permissions)) {
      res.status(403).json({ message: 'Access denied to this tool' });
      return;
    }

    // Attach schema to request for later use
    (req as Request & { toolSchema: typeof schema }).toolSchema = schema;
    next();
  } catch (error) {
    next(error);
  }
}

// Middleware to check specific permissions
export function checkPermission(permission: 'create' | 'read' | 'update' | 'delete' | 'audit') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const toolSchema = (req as Request & { toolSchema?: { permissions: unknown } }).toolSchema;

      if (!toolSchema) {
        res.status(500).json({ message: 'Tool schema not loaded' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const permissions = toolSchema.permissions as import('@toolforge/shared').ToolPermissions;
      let hasPermission = false;

      switch (permission) {
        case 'create':
          hasPermission = canCreate(req.user.role, permissions);
          break;
        case 'read':
          hasPermission = canRead(req.user.role, permissions);
          break;
        case 'update':
          hasPermission = canUpdate(req.user.role, permissions);
          break;
        case 'delete':
          hasPermission = canDelete(req.user.role, permissions);
          break;
        case 'audit':
          hasPermission = canViewAuditLog(req.user.role, permissions);
          break;
      }

      if (!hasPermission) {
        res.status(403).json({ message: `No permission to ${permission}` });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Middleware to check action permissions
export async function checkActionPermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { actionId } = req.params;
    const toolSchema = (req as Request & { toolSchema?: { actions?: import('@toolforge/shared').ToolAction[] } }).toolSchema;

    if (!toolSchema) {
      res.status(500).json({ message: 'Tool schema not loaded' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const action = toolSchema.actions?.find((a) => a.id === actionId);
    if (!action) {
      res.status(404).json({ message: 'Action not found' });
      return;
    }

    if (!canRunAction(req.user.role, action)) {
      res.status(403).json({ message: 'No permission to run this action' });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
