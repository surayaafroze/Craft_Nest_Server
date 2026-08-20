import { prisma } from '../config/db';
import { ItemStatus } from '@prisma/client';

export class DashboardService {
  public static async getDashboardOverview(userId: string) {
    try {
      const [
        totalItems,
        approvedItems,
        pendingItems,
        rejectedItems,
        avgRatingAgg,
        totalReviews
      ] = await Promise.all([
        prisma.item.count({ where: { ownerId: userId } }).catch(() => 0),
        prisma.item.count({ where: { ownerId: userId, status: ItemStatus.approved } }).catch(() => 0),
        prisma.item.count({ where: { ownerId: userId, status: ItemStatus.pending } }).catch(() => 0),
        prisma.item.count({ where: { ownerId: userId, status: ItemStatus.rejected } }).catch(() => 0),
        prisma.item.aggregate({ where: { ownerId: userId }, _avg: { avgRating: true } }).catch(() => ({ _avg: { avgRating: 0 } })),
        prisma.review.count({ where: { item: { ownerId: userId } } }).catch(() => 0)
      ]);

      const rawAvg = avgRatingAgg?._avg?.avgRating ?? 0;
      const averageRating = (isNaN(rawAvg) || rawAvg < 0) ? 0 : Math.round(rawAvg * 10) / 10;

      return {
        totalItems: totalItems || 0,
        approvedItems: approvedItems || 0,
        pendingItems: pendingItems || 0,
        rejectedItems: rejectedItems || 0,
        totalReviews: totalReviews || 0,
        averageRating: averageRating || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      return {
        totalItems: 0,
        approvedItems: 0,
        pendingItems: 0,
        rejectedItems: 0,
        totalReviews: 0,
        averageRating: 0,
      };
    }
  }
}
