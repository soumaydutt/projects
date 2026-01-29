import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { schemaRoutes } from './schema.routes.js';
import { toolRoutes } from './tool.routes.js';
import { userRoutes } from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/schemas', schemaRoutes);
router.use('/tools', toolRoutes);
router.use('/users', userRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { router as apiRoutes };
