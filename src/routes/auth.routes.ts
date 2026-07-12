import { Router } from 'express';
import { me, syncSession, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, me as any);
router.post('/sync', syncSession as any);
router.post('/logout', logout as any);

export default router;
