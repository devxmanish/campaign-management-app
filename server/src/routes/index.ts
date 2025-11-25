import { Router } from 'express';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';
import exportRoutes from './export.routes';
import userRoutes from './user.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/exports', exportRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
