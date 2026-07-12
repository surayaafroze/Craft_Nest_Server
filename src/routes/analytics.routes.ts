import { Router } from 'express';
import { getUserAnalytics, getPlatformAnalytics } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';
import { adminOnly } from '../middleware/roleGuard';

const router = Router();

// Get logged-in user analytics
router.get('/user', requireAuth, getUserAnalytics as any);

// Get platform-wide admin analytics
router.get('/platform', requireAuth, adminOnly, getPlatformAnalytics as any);

export default router;
