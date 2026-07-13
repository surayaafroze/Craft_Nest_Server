import { Router } from 'express';
import { getMe, updateMe, getUsers, updateUserStatus } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';
import { adminOnly } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { updateUserSchema, updateUserStatusSchema } from '../validators/user.validator';

const router = Router();

// Retrieve logged-in user profile
router.get('/me', requireAuth, getMe as any);

// Update logged-in user profile
router.patch('/me', requireAuth, validate(updateUserSchema), updateMe as any);

// Admin: List all users
router.get('/', requireAuth, adminOnly, getUsers as any);

// Admin: Suspend/activate/promote user
router.patch('/:id/status', requireAuth, adminOnly, validate(updateUserStatusSchema), updateUserStatus as any);

export default router;
