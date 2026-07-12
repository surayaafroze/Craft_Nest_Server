import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReviewService } from '../services/review.service';

export const getItemReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const reviews = await ReviewService.getReviewsByItem(id);

    res.status(200).json({
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user ? {
          id: r.user.id.toString(),
          name: r.user.name,
          avatarUrl: r.user.avatarUrl,
        } : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const reviews = await ReviewService.getMyReviews(req.user.userId);

    res.status(200).json({
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        item: r.item ? {
          id: r.item.id.toString(),
          title: r.item.title,
          images: r.item.images,
        } : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const { rating, comment } = req.body;

    try {
      const newReview = await ReviewService.createReview(req.user.userId, id, { rating, comment });
      res.status(201).json({
        message: 'Review submitted successfully',
        review: {
          id: newReview._id.toString(),
          userId: req.user.userId,
          itemId: id,
          rating,
          comment,
          createdAt: newReview.createdAt,
        },
      });
    } catch (err: any) {
      if (err.message === 'Item not found') {
        res.status(404).json({ error: 'Item not found' });
      } else if (err.message === 'You cannot review your own item.' || err.message === 'You have already reviewed this item.') {
        res.status(400).json({ error: err.message });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid review ID format' });
      return;
    }

    const { rating, comment } = req.body;
    
    const review = await ReviewService.getReviewById(id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (review.userId.toString() !== req.user.userId) {
      res.status(403).json({ error: 'You can only update your own reviews' });
      return;
    }

    const updatedReview = await ReviewService.updateReview(id, { rating, comment });
    
    res.status(200).json({
      message: 'Review updated successfully',
      review: updatedReview ? {
        id: updatedReview._id.toString(),
        userId: updatedReview.userId.toString(),
        itemId: updatedReview.itemId.toString(),
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt,
      } : null
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid review ID format' });
      return;
    }

    const review = await ReviewService.getReviewById(id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const isAdmin = req.user.role === 'admin';
    if (review.userId.toString() !== req.user.userId && !isAdmin) {
      res.status(403).json({ error: 'You can only delete your own reviews' });
      return;
    }

    await ReviewService.deleteReview(id);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
