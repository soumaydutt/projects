import { Router } from 'express';
import { userController } from '../controllers/index.js';
import { authenticate, requireAdmin, validate } from '../middleware/index.js';
import { registerSchema } from '@toolforge/shared';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - Get all users (admin only)
router.get('/', requireAdmin, (req, res, next) => userController.getAll(req, res, next));

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', requireAdmin, (req, res, next) => userController.getById(req, res, next));

// POST /api/users - Create user (admin only)
router.post('/', requireAdmin, validate(registerSchema), (req, res, next) =>
  userController.create(req, res, next)
);

// PUT /api/users/:id - Update user (admin only)
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'manager', 'agent', 'viewer']).optional(),
  isActive: z.boolean().optional(),
});

router.put('/:id', requireAdmin, validate(updateUserSchema), (req, res, next) =>
  userController.update(req, res, next)
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireAdmin, (req, res, next) => userController.delete(req, res, next));

export { router as userRoutes };
