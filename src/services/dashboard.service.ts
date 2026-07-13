import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';

export class DashboardService {
  public static async getDashboardOverview(userId: string) {
    const db = getDb();
    const itemsCollection = db.collection('items');
    const reviewsCollection = db.collection('reviews');
    const userIdObj = new ObjectId(userId);

    // Get item statistics (total, approved, pending, rejected, and average rating)
    const itemsStats = await itemsCollection
      .aggregate([
        { $match: { ownerId: userIdObj } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            approvedItems: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pendingItems: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejectedItems: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            avgRating: { $avg: '$avgRating' },
          },
        },
      ])
      .toArray();

    const stats = itemsStats[0] || {
      totalItems: 0,
      approvedItems: 0,
      pendingItems: 0,
      rejectedItems: 0,
      avgRating: 0
    };

    const avgRating = Math.round((stats.avgRating || 0) * 10) / 10;

    // Get total reviews received for user's items
    const reviewStats = await reviewsCollection
      .aggregate([
        {
          $lookup: {
            from: 'items',
            localField: 'itemId',
            foreignField: '_id',
            as: 'item',
          },
        },
        { $unwind: '$item' },
        { $match: { 'item.ownerId': userIdObj } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalReviews = reviewStats[0]?.totalReviews || 0;

    return {
      totalItems: stats.totalItems,
      approvedItems: stats.approvedItems,
      pendingItems: stats.pendingItems,
      rejectedItems: stats.rejectedItems,
      totalReviews,
      averageRating: avgRating
    };
  }
}
