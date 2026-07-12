import { Router } from 'express';
import { submitContactMessage, getAllMessages, updateMessageStatus, deleteMessage } from '../controllers/contact.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitContactSchema, updateContactStatusSchema } from '../validators/contact.validator';

const router = Router();

// Public route
router.post('/', validate(submitContactSchema), submitContactMessage as any);

// Admin-only routes
router.get('/', requireAuth, getAllMessages as any);
router.patch('/:id', requireAuth, validate(updateContactStatusSchema), updateMessageStatus as any);
router.delete('/:id', requireAuth, deleteMessage as any);

export default router;
