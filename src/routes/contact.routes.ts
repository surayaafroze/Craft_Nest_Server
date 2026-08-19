import { Router } from 'express';
import { submitContactMessage, getAllMessages, updateMessageStatus, deleteMessage } from '../controllers/contact.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitContactSchema, updateContactStatusSchema } from '../validators/contact.validator';

const router = Router();

/**
 * @route   POST /api/contact
 * @desc    Submit a contact message
 * @access  Public
 */
router.post('/', validate(submitContactSchema), submitContactMessage as any);

/**
 * @route   GET /api/contact
 * @desc    Get all contact messages (Admin)
 * @access  Private (Admin)
 */
router.get('/', requireAuth, getAllMessages as any);

/**
 * @route   PATCH /api/contact/:id
 * @desc    Update contact message status
 * @access  Private (Admin)
 */
router.patch('/:id', requireAuth, validate(updateContactStatusSchema), updateMessageStatus as any);

/**
 * @route   DELETE /api/contact/:id
 * @desc    Delete contact message
 * @access  Private (Admin)
 */
router.delete('/:id', requireAuth, deleteMessage as any);

export default router;
