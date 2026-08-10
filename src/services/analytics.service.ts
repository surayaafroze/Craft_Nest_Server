import { prisma } from '../config/db';

export class AnalyticsService {
  public static async getUserAnalytics(userId: string) {
    // 1. Items General Stats (total items & average rating)
    const totalItems = await prisma.item.count({ where: { ownerId: userId } });
    const itemRatingAgg = await prisma.item.aggregate({
      where: { ownerId: userId },
      _avg: { avgRating: true },
    });

    const rawAvgRating = itemRatingAgg._avg.avgRating || 0;
    const avgRating = Math.round(rawAvgRating * 10) / 10;

    // 2. Reviews Stats & Rating Distribution (total reviews received & ratings 1-5 counts)
    const reviews = await prisma.review.findMany({
      where: { item: { ownerId: userId } },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    const ratingDistribution = [
      { rating: '1 Star', count: counts[1] },
      { rating: '2 Star', count: counts[2] },
      { rating: '3 Star', count: counts[3] },
      { rating: '4 Star', count: counts[4] },
      { rating: '5 Star', count: counts[5] },
    ];

    // 3. Items grouped by category
    const categoryGroup = await prisma.item.groupBy({
      by: ['category'],
      where: { ownerId: userId },
      _count: { id: true },
    });

    const categoryDistribution = categoryGroup.map((cg) => ({
      name: cg.category,
      value: cg._count.id,
    }));

    // 4. Item activity over time (items created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentItems = await prisma.item.findMany({
      where: {
        ownerId: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const activityMap = new Map<string, number>();
    recentItems.forEach((item) => {
      const dateStr = item.createdAt.toISOString().split('T')[0];
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    });

    const activityOverTime = Array.from(activityMap.entries()).map(([date, itemsCreated]) => ({
      date,
      itemsCreated,
    }));

    return {
      stats: {
        totalItems,
        avgRating,
        totalReviewsReceived: totalReviews,
      },
      charts: {
        categoryDistribution,
        ratingDistribution,
        activityOverTime,
      },
    };
  }

  public static async getPlatformAnalytics() {
    // 1. Total counts
    const totalUsers = await prisma.user.count();
    const totalItems = await prisma.item.count();
    const totalReviews = await prisma.review.count();

    // 2. Total unique categories count
    const categories = await prisma.item.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const totalCategories = categories.length;

    // 3. Status breakdowns
    const statusGroup = await prisma.item.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    statusGroup.forEach((sg) => {
      if (sg.status === 'pending') statusCounts.pending = sg._count.id;
      if (sg.status === 'approved') statusCounts.approved = sg._count.id;
      if (sg.status === 'rejected') statusCounts.rejected = sg._count.id;
    });

    // 4. User growth over time (users created per month)
    const users = await prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const userGrowthMap = new Map<string, number>();
    users.forEach((u) => {
      const monthStr = u.createdAt.toISOString().slice(0, 7);
      userGrowthMap.set(monthStr, (userGrowthMap.get(monthStr) || 0) + 1);
    });
    const userGrowth = Array.from(userGrowthMap.entries()).map(([month, newUsers]) => ({
      month,
      newUsers,
    }));

    // 5. New items over time (items created per month)
    const items = await prisma.item.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const itemGrowthMap = new Map<string, number>();
    items.forEach((i) => {
      const monthStr = i.createdAt.toISOString().slice(0, 7);
      itemGrowthMap.set(monthStr, (itemGrowthMap.get(monthStr) || 0) + 1);
    });
    const itemGrowth = Array.from(itemGrowthMap.entries()).map(([month, newItems]) => ({
      month,
      newItems,
    }));

    // 6. Top contributors (users with most items)
    const topOwners = await prisma.item.groupBy({
      by: ['ownerId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const ownerIds = topOwners.map((to) => to.ownerId);
    const ownerUsers = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(ownerUsers.map((u) => [u.id, u]));

    const topContributors = topOwners.map((to) => {
      const u = userMap.get(to.ownerId);
      return {
        name: u?.name || 'Unknown',
        email: u?.email || '',
        itemCount: to._count.id,
      };
    });

    // 7. Top categories (categories with most items)
    const topCatGroup = await prisma.item.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topCategories = topCatGroup.map((tc) => ({
      category: tc.category,
      itemCount: tc._count.id,
    }));

    return {
      stats: {
        totalUsers,
        totalItems,
        totalReviews,
        totalCategories,
        pendingItems: statusCounts.pending,
        approvedItems: statusCounts.approved,
        rejectedItems: statusCounts.rejected,
      },
      charts: {
        userGrowth,
        itemGrowth,
        topContributors,
        topCategories,
      },
    };
  }
}
