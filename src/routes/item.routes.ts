import { Router } from 'express';
import {
  getItems,
  getItemById,
  getRelatedItems,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
  updateItemStatus,
} from '../controllers/item.controller';
import { requireAuth } from '../middleware/auth';
import { adminOnly, ownerOrAdminGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { createItemSchema, updateItemSchema, updateStatusSchema } from '../validators/item.validator';

const router = Router();

// Public routes
router.get('/', getItems);
router.get('/related/:id', getRelatedItems);
router.get('/:id', getItemById);

// Authenticated routes
router.get('/mine', requireAuth, getMyItems as any);
router.post('/', requireAuth, validate(createItemSchema), createItem as any);
router.put('/:id', requireAuth, ownerOrAdminGuard({ collection: 'items' }), validate(updateItemSchema), updateItem as any);
router.delete('/:id', requireAuth, ownerOrAdminGuard({ collection: 'items' }), deleteItem as any);

// Admin-only route
router.patch('/:id/status', requireAuth, adminOnly, validate(updateStatusSchema), updateItemStatus as any);

export default router;
