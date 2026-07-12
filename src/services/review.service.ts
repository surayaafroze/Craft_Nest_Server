import { ObjectId, Db } from 'mongodb';
import { getDb } from '../config/db';
import { ReviewDocument } from '../types/review';
import { ItemDocument } from '../types/item';

export class ReviewService {
  
  /**
   * Recalculates the avgRating and reviewCount for an item based on the reviews collection.
   */
  public static async recalculateItemStats(db: Db, itemId: ObjectId): Promise<void> {
    const reviewsCollection = db.collection<ReviewDocument>('reviews');
    const itemsCollection = db.collection<ItemDocument>('items');

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
  }

  public static async getReviewsByItem(itemId: string): Promise<any[]> {
    const db = getDb();
    const reviewsCollection = db.collection<ReviewDocument>('reviews');
    const itemIdObj = new ObjectId(itemId);

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

    return reviews;
  }

  public static async getMyReviews(userId: string): Promise<any[]> {
    const db = getDb();
    const reviewsCollection = db.collection<ReviewDocument>('reviews');
    const userIdObj = new ObjectId(userId);

    const reviews = await reviewsCollection
      .aggregate([
        { $match: { userId: userIdObj } },
        {
          $lookup: {
            from: 'items',
            localField: 'itemId',
            foreignField: '_id',
            as: 'item',
          },
        },
        { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            createdAt: 1,
            item: {
              id: '$item._id',
              title: '$item.title',
              images: '$item.images',
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return reviews;
  }

  public static async createReview(userId: string, itemId: string, data: { rating: number; comment: string }): Promise<ReviewDocument> {
    const db = getDb();
    const itemsCollection = db.collection<ItemDocument>('items');
    const reviewsCollection = db.collection<ReviewDocument>('reviews');

    const itemIdObj = new ObjectId(itemId);
    const userIdObj = new ObjectId(userId);

    const item = await itemsCollection.findOne({ _id: itemIdObj });
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.ownerId.toString() === userId) {
      throw new Error('You cannot review your own item.');
    }

    const newReview: ReviewDocument = {
      _id: new ObjectId(),
      userId: userIdObj,
      itemId: itemIdObj,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date(),
    };

    try {
      await reviewsCollection.insertOne(newReview);
    } catch (dbError: any) {
      // MongoDB code 11000 indicates unique index collision
      if (dbError.code === 11000) {
        throw new Error('You have already reviewed this item.');
      }
      throw dbError;
    }

    await this.recalculateItemStats(db, itemIdObj);
    return newReview;
  }

  public static async updateReview(reviewId: string, data: { rating?: number; comment?: string }): Promise<ReviewDocument | null> {
    const db = getDb();
    const reviewsCollection = db.collection<ReviewDocument>('reviews');
    const reviewIdObj = new ObjectId(reviewId);

    const review = await reviewsCollection.findOne({ _id: reviewIdObj });
    if (!review) {
      return null;
    }

    const updateDoc: any = {};
    if (data.rating !== undefined) updateDoc.rating = data.rating;
    if (data.comment !== undefined) updateDoc.comment = data.comment;

    await reviewsCollection.updateOne({ _id: reviewIdObj }, { $set: updateDoc });
    
    // Recalculate stats since rating might have changed
    await this.recalculateItemStats(db, review.itemId);
    
    // Return updated review
    return reviewsCollection.findOne({ _id: reviewIdObj });
  }

  public static async deleteReview(reviewId: string): Promise<boolean> {
    const db = getDb();
    const reviewsCollection = db.collection<ReviewDocument>('reviews');
    const reviewIdObj = new ObjectId(reviewId);

    const review = await reviewsCollection.findOne({ _id: reviewIdObj });
    if (!review) {
      return false;
    }

    await reviewsCollection.deleteOne({ _id: reviewIdObj });
    await this.recalculateItemStats(db, review.itemId);

    return true;
  }

  public static async getReviewById(reviewId: string): Promise<ReviewDocument | null> {
    const db = getDb();
    const reviewsCollection = db.collection<ReviewDocument>('reviews');
    return reviewsCollection.findOne({ _id: new ObjectId(reviewId) });
  }
}
