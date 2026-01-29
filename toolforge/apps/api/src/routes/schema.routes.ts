import { Router } from 'express';
import { schemaController } from '../controllers/index.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/schemas - Get all schemas (admin sees all, others see accessible)
router.get('/', (req, res, next) => schemaController.getAll(req, res, next));

// GET /api/schemas/tool/:toolId - Get schema by tool ID
router.get('/tool/:toolId', (req, res, next) => schemaController.getByToolId(req, res, next));

// GET /api/schemas/:id - Get schema by ID
router.get('/:id', (req, res, next) => schemaController.getById(req, res, next));

// Admin-only routes
// POST /api/schemas - Create new schema
router.post('/', requireAdmin, (req, res, next) => schemaController.create(req, res, next));

// POST /api/schemas/validate - Validate schema JSON
router.post('/validate', requireAdmin, (req, res, next) => schemaController.validate(req, res, next));

// PUT /api/schemas/:id - Update schema
router.put('/:id', requireAdmin, (req, res, next) => schemaController.update(req, res, next));

// POST /api/schemas/:id/publish - Publish schema
router.post('/:id/publish', requireAdmin, (req, res, next) => schemaController.publish(req, res, next));

// POST /api/schemas/:id/unpublish - Unpublish schema
router.post('/:id/unpublish', requireAdmin, (req, res, next) => schemaController.unpublish(req, res, next));

// DELETE /api/schemas/:id - Delete schema
router.delete('/:id', requireAdmin, (req, res, next) => schemaController.delete(req, res, next));

export { router as schemaRoutes };
