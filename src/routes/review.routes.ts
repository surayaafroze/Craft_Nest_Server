import { Router } from 'express';
import { getItemReviews, createReview, deleteReview } from '../controllers/review.controller';
import { requireAuth } from '../middleware/auth';
import { ownerOrAdminGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validators/review.validator';

const router = Router();

// Retrieve reviews for a specific item
router.get('/items/:id/reviews', getItemReviews);

// Add a review for a specific item
router.post('/items/:id/reviews', requireAuth, validate(createReviewSchema), createReview as any);

// Delete a specific review by its ID
router.delete('/reviews/:id', requireAuth, ownerOrAdminGuard({ collection: 'reviews', ownerField: 'userId' }), deleteReview as any);

export default router;
