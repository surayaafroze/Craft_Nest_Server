import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Retrieve user's wishlist
router.get('/', requireAuth, getWishlist as any);

// Add an item to user's wishlist
router.post('/:itemId', requireAuth, addToWishlist as any);

// Remove an item from user's wishlist
router.delete('/:itemId', requireAuth, removeFromWishlist as any);

export default router;
