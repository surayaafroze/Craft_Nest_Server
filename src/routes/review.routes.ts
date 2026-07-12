import { Router } from 'express';
import { getItemReviews, getMyReviews, createReview, updateReview, deleteReview } from '../controllers/review.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator';

const router = Router();

// Retrieve reviews for a specific item
router.get('/items/:id/reviews', getItemReviews);

// Add a review for a specific item
router.post('/items/:id/reviews', requireAuth, validate(createReviewSchema), createReview as any);

// Update a specific review by its ID
router.put('/reviews/:id', requireAuth, validate(updateReviewSchema), updateReview as any);

// Delete a specific review by its ID
// We handle ownership inside the controller instead of using ownerOrAdminGuard
// because we need to use the ReviewService to fetch the review first.
router.delete('/reviews/:id', requireAuth, deleteReview as any);

// Retrieve reviews for the logged-in user
router.get('/reviews/me', requireAuth, getMyReviews as any);

export default router;
