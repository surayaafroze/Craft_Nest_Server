import { prisma } from '../config/db';
import { ItemStatus } from '@prisma/client';

export class DashboardService {
  public static async getDashboardOverview(userId: string) {
    const [
      totalItems,
      approvedItems,
      pendingItems,
      rejectedItems,
      avgRatingAgg,
      totalReviews
    ] = await Promise.all([
      prisma.item.count({ where: { ownerId: userId } }),
      prisma.item.count({ where: { ownerId: userId, status: ItemStatus.approved } }),
      prisma.item.count({ where: { ownerId: userId, status: ItemStatus.pending } }),
      prisma.item.count({ where: { ownerId: userId, status: ItemStatus.rejected } }),
      prisma.item.aggregate({ where: { ownerId: userId }, _avg: { avgRating: true } }),
      prisma.review.count({ where: { item: { ownerId: userId } } })
    ]);

    const rawAvg = avgRatingAgg._avg.avgRating ?? 0;
    const averageRating = (isNaN(rawAvg) || rawAvg < 0) ? 0 : Math.round(rawAvg * 10) / 10;

    return {
      totalItems,
      approvedItems,
      pendingItems,
      rejectedItems,
      totalReviews,
      averageRating,
    };
  }
}
