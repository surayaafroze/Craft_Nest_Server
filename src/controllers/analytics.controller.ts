import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { ROLES } from '../constants/roles';

export const getUserAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = getDb();
    const itemsCollection = db.collection('items');
    const reviewsCollection = db.collection('reviews');
    const userIdObj = new ObjectId(req.user.userId);

    // 1. Items General Stats (total items & average rating)
    const itemsStats = await itemsCollection
      .aggregate([
        { $match: { ownerId: userIdObj } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            avgRating: { $avg: '$avgRating' },
          },
        },
      ])
      .toArray();

    const totalItems = itemsStats[0]?.totalItems || 0;
    const rawAvgRating = itemsStats[0]?.avgRating || 0;
    const avgRating = Math.round(rawAvgRating * 10) / 10;

    // 2. Reviews Stats & Rating Distribution (total reviews received & ratings 1-5 counts)
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
            rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ])
      .toArray();

    const totalReviews = reviewStats[0]?.totalReviews || 0;
    const ratingDistribution = [
      { rating: '1 Star', count: reviewStats[0]?.rating1 || 0 },
      { rating: '2 Star', count: reviewStats[0]?.rating2 || 0 },
      { rating: '3 Star', count: reviewStats[0]?.rating3 || 0 },
      { rating: '4 Star', count: reviewStats[0]?.rating4 || 0 },
      { rating: '5 Star', count: reviewStats[0]?.rating5 || 0 },
    ];

    // 3. Items grouped by category
    const categoryStats = await itemsCollection
      .aggregate([
        { $match: { ownerId: userIdObj } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $project: { name: '$_id', value: '$count', _id: 0 } },
      ])
      .toArray();

    // 4. Item activity over time (items created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityStats = await itemsCollection
      .aggregate([
        {
          $match: {
            ownerId: userIdObj,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', itemsCreated: '$count', _id: 0 } },
      ])
      .toArray();

    res.status(200).json({
      summary: {
        totalItems,
        avgRating,
        totalReviewsReceived: totalReviews,
      },
      categoryDistribution: categoryStats,
      ratingDistribution,
      activityOverTime: activityStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const db = getDb();
    const usersCollection = db.collection('users');
    const itemsCollection = db.collection('items');
    const reviewsCollection = db.collection('reviews');

    // 1. Total counts
    const totalUsers = await usersCollection.countDocuments();
    const totalItems = await itemsCollection.countDocuments();
    const totalReviews = await reviewsCollection.countDocuments();

    // 2. Total unique categories count
    const categories = await itemsCollection.distinct('category');
    const totalCategories = categories.length;

    // 3. Status breakdowns
    const statusStats = await itemsCollection
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    statusStats.forEach((stat) => {
      if (stat._id === 'pending') statusCounts.pending = stat.count;
      if (stat._id === 'approved') statusCounts.approved = stat.count;
      if (stat._id === 'rejected') statusCounts.rejected = stat.count;
    });

    // 4. User growth over time (users created per month)
    const userGrowth = await usersCollection
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', newUsers: 1, _id: 0 } },
      ])
      .toArray();

    // 5. New items over time (items created per month)
    const itemGrowth = await itemsCollection
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            newItems: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', newItems: 1, _id: 0 } },
      ])
      .toArray();

    // 6. Top contributors (users with most items)
    const topContributors = await itemsCollection
      .aggregate([
        {
          $group: {
            _id: '$ownerId',
            itemCount: { $sum: 1 },
          },
        },
        { $sort: { itemCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', itemCount: 1, _id: 0 } },
      ])
      .toArray();

    // 7. Top categories (categories with most items)
    const topCategories = await itemsCollection
      .aggregate([
        {
          $group: {
            _id: '$category',
            itemCount: { $sum: 1 },
          },
        },
        { $sort: { itemCount: -1 } },
        { $limit: 5 },
        { $project: { category: '$_id', itemCount: 1, _id: 0 } },
      ])
      .toArray();

    res.status(200).json({
      summary: {
        totalUsers,
        totalItems,
        totalReviews,
        totalCategories,
        pendingItems: statusCounts.pending,
        approvedItems: statusCounts.approved,
        rejectedItems: statusCounts.rejected,
      },
      userGrowth,
      itemGrowth,
      topContributors,
      topCategories,
    });
  } catch (error) {
    next(error);
  }
};
