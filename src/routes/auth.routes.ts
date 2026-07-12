import { Router } from 'express';
import { me } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/me', authMiddleware, me as any);

export default router;
