import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../validators/user.validator';

const router = Router();

// Retrieve logged-in user profile
router.get('/me', requireAuth, getMe as any);

// Update logged-in user profile
router.patch('/me', requireAuth, validate(updateUserSchema), updateMe as any);

export default router;
