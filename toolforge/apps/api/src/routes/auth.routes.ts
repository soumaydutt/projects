import { Router } from 'express';
import { authController } from '../controllers/index.js';
import { authenticate, validate } from '../middleware/index.js';
import { loginSchema } from '@toolforge/shared';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/logout
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export { router as authRoutes };
