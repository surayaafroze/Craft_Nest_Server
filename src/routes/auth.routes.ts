import { Router } from 'express';
import { register, login, logout, me, googleLogin } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { registerSchema, loginSchema, googleSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me as any);
router.post('/google', validate(googleSchema), googleLogin);

export default router;
