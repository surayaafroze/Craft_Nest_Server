import { prisma } from '../config/db';
import { ItemStatus } from '@prisma/client';

export class DashboardService {
  public static async getDashboardOverview(userId: string) {
    const totalItems = await prisma.item.count({ where: { ownerId: userId } });
    const approvedItems = await prisma.item.count({ where: { ownerId: userId, status: ItemStatus.approved } });
    const pendingItems = await prisma.item.count({ where: { ownerId: userId, status: ItemStatus.pending } });
    const rejectedItems = await prisma.item.count({ where: { ownerId: userId, status: ItemStatus.rejected } });

    const avgRatingAgg = await prisma.item.aggregate({
      where: { ownerId: userId },
      _avg: { avgRating: true },
    });

    const rawAvg = avgRatingAgg._avg.avgRating ?? 0;
    const averageRating = (isNaN(rawAvg) || rawAvg < 0) ? 0 : Math.round(rawAvg * 10) / 10;

    const totalReviews = await prisma.review.count({
      where: { item: { ownerId: userId } },
    });

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
