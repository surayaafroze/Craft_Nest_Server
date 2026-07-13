import { Router } from 'express';
import { getOverview } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Retrieve dashboard overview
router.get('/overview', requireAuth, getOverview as any);

export default router;
