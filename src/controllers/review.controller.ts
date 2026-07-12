import { Request, Response, NextFunction } from 'express';
import { ObjectId, Db } from 'mongodb';
import { getDb } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to recalculate average rating and review count for an item
export const updateItemRatingStats = async (db: Db, itemId: ObjectId): Promise<void> => {
  const reviewsCollection = db.collection('reviews');
  const itemsCollection = db.collection('items');

  const stats = await reviewsCollection
    .aggregate([
      { $match: { itemId } },
      {
        $group: {
          _id: '$itemId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ])
    .toArray();

  if (stats.length > 0) {
    const { avgRating, reviewCount } = stats[0];
    await itemsCollection.updateOne(
      { _id: itemId },
      {
        $set: {
          avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
          reviewCount,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    await itemsCollection.updateOne(
      { _id: itemId },
      {
        $set: {
          avgRating: 0,
          reviewCount: 0,
          updatedAt: new Date(),
        },
      }
    );
  }
};

export const getItemReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const db = getDb();
    const reviewsCollection = db.collection('reviews');

    let itemIdObj: ObjectId;
    try {
      itemIdObj = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const reviews = await reviewsCollection
      .aggregate([
        { $match: { itemId: itemIdObj } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            createdAt: 1,
            user: {
              id: '$user._id',
              name: '$user.name',
              avatarUrl: '$user.avatarUrl',
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

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

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const { rating, comment } = req.body;
    const db = getDb();
    const itemsCollection = db.collection('items');
    const reviewsCollection = db.collection('reviews');

    let itemIdObj: ObjectId;
    try {
      itemIdObj = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const item = await itemsCollection.findOne({ _id: itemIdObj });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Prevent owners from reviewing their own item
    if (item.ownerId.toString() === req.user.userId) {
      res.status(400).json({ error: 'You cannot review your own item.' });
      return;
    }

    const userIdObj = new ObjectId(req.user.userId);
    const newReview = {
      userId: userIdObj,
      itemId: itemIdObj,
      rating,
      comment,
      createdAt: new Date(),
    };

    try {
      await reviewsCollection.insertOne(newReview);
    } catch (dbError: any) {
      // MongoDB code 11000 indicates unique index collision
      if (dbError.code === 11000) {
        res.status(400).json({ error: 'You have already reviewed this item.' });
        return;
      }
      throw dbError;
    }

    await updateItemRatingStats(db, itemIdObj);

    res.status(201).json({
      message: 'Review submitted successfully',
      review: {
        userId: req.user.userId,
        itemId: id,
        rating,
        comment,
        createdAt: newReview.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid review ID format' });
      return;
    }

    const db = getDb();
    const reviewsCollection = db.collection('reviews');

    let reviewIdObj: ObjectId;
    try {
      reviewIdObj = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid review ID format' });
      return;
    }

    const review = await reviewsCollection.findOne({ _id: reviewIdObj });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    await reviewsCollection.deleteOne({ _id: reviewIdObj });
    await updateItemRatingStats(db, review.itemId);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
