import { prisma } from '../config/db';
import { ReviewDocument } from '../types/review';

export class ReviewService {
  /**
   * Recalculates the avgRating and reviewCount for an item based on the reviews table.
   */
  public static async recalculateItemStats(itemId: string): Promise<void> {
    const stats = await prisma.review.aggregate({
      where: { itemId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const reviewCount = stats._count.rating || 0;
    const rawAvg = stats._avg.rating || 0;
    const avgRating = reviewCount > 0 ? Math.round(rawAvg * 10) / 10 : 0;

    await prisma.item.update({
      where: { id: itemId },
      data: {
        avgRating,
        reviewCount,
      },
    });
  }

  public static async getReviewsByItem(itemId: string): Promise<any[]> {
    const reviews = await prisma.review.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return reviews.map((r) => ({
      _id: r.id,
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        id: r.user.id,
        name: r.user.name,
        avatarUrl: r.user.avatarUrl,
      },
    }));
  }

  public static async getMyReviews(userId: string): Promise<any[]> {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });

    return reviews.map((r) => ({
      _id: r.id,
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      item: {
        id: r.item.id,
        title: r.item.title,
        images: r.item.images,
      },
    }));
  }

  public static async createReview(
    userId: string,
    itemId: string,
    data: { rating: number; comment: string }
  ): Promise<ReviewDocument> {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.ownerId === userId) {
      throw new Error('You cannot review your own item.');
    }

    try {
      const newReview = await prisma.review.create({
        data: {
          userId,
          itemId,
          rating: data.rating,
          comment: data.comment,
        },
      });

      await this.recalculateItemStats(itemId);
      return {
        ...newReview,
        _id: newReview.id,
      };
    } catch (dbError: any) {
      // P2002 is Prisma's unique constraint error code
      if (dbError.code === 'P2002') {
        throw new Error('You have already reviewed this item.');
      }
      throw dbError;
    }
  }

  public static async updateReview(
    reviewId: string,
    data: { rating?: number; comment?: string }
  ): Promise<ReviewDocument | null> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return null;
    }

    const updateDoc: any = {};
    if (data.rating !== undefined) updateDoc.rating = data.rating;
    if (data.comment !== undefined) updateDoc.comment = data.comment;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateDoc,
    });

    await this.recalculateItemStats(review.itemId);

    return {
      ...updatedReview,
      _id: updatedReview.id,
    };
  }

  public static async deleteReview(reviewId: string): Promise<boolean> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return false;
    }

    await prisma.review.delete({ where: { id: reviewId } });
    await this.recalculateItemStats(review.itemId);

    return true;
  }

  public static async getReviewById(reviewId: string): Promise<ReviewDocument | null> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return null;
    return {
      ...review,
      _id: review.id,
    };
  }
}
