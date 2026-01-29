import { Router } from 'express';
import { recordController, auditController } from '../controllers/index.js';
import {
  authenticate,
  checkToolAccess,
  checkPermission,
  checkActionPermission,
} from '../middleware/index.js';

const router = Router();

// All routes require authentication and tool access check
router.use(authenticate);

// GET /api/tools/:toolId/records - Query records
router.get(
  '/:toolId/records',
  checkToolAccess,
  checkPermission('read'),
  (req, res, next) => recordController.query(req, res, next)
);

// POST /api/tools/:toolId/records - Create record
router.post(
  '/:toolId/records',
  checkToolAccess,
  checkPermission('create'),
  (req, res, next) => recordController.create(req, res, next)
);

// POST /api/tools/:toolId/records/bulk - Bulk update records
router.post(
  '/:toolId/records/bulk',
  checkToolAccess,
  checkPermission('update'),
  (req, res, next) => recordController.bulkUpdate(req, res, next)
);

// GET /api/tools/:toolId/records/:recordId - Get single record
router.get(
  '/:toolId/records/:recordId',
  checkToolAccess,
  checkPermission('read'),
  (req, res, next) => recordController.getById(req, res, next)
);

// PUT /api/tools/:toolId/records/:recordId - Update record
router.put(
  '/:toolId/records/:recordId',
  checkToolAccess,
  checkPermission('update'),
  (req, res, next) => recordController.update(req, res, next)
);

// DELETE /api/tools/:toolId/records/:recordId - Delete record
router.delete(
  '/:toolId/records/:recordId',
  checkToolAccess,
  checkPermission('delete'),
  (req, res, next) => recordController.delete(req, res, next)
);

// POST /api/tools/:toolId/actions/:actionId - Execute action
router.post(
  '/:toolId/actions/:actionId',
  checkToolAccess,
  checkActionPermission,
  (req, res, next) => recordController.executeAction(req, res, next)
);

// GET /api/tools/:toolId/audit - Get audit logs for tool
router.get(
  '/:toolId/audit',
  checkToolAccess,
  checkPermission('audit'),
  (req, res, next) => auditController.query(req, res, next)
);

// GET /api/tools/:toolId/records/:recordId/audit - Get audit logs for record
router.get(
  '/:toolId/records/:recordId/audit',
  checkToolAccess,
  checkPermission('audit'),
  (req, res, next) => auditController.getByRecordId(req, res, next)
);

export { router as toolRoutes };
