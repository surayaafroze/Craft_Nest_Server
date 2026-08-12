import { Router } from 'express';
import { register, login, googleAuth, me, syncSession, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, googleSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), register as any);
router.post('/login', validate(loginSchema), login as any);
router.post('/google', validate(googleSchema), googleAuth as any);
router.get('/me', requireAuth, me as any);
router.post('/sync', syncSession as any);
router.post('/logout', logout as any);

export default router;

