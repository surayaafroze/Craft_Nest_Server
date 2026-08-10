import { prisma } from '../config/db';
import { ItemStatus } from '@prisma/client';

export class WishlistService {
  public static async getWishlist(userId: string): Promise<any> {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                title: true,
                shortDescription: true,
                price: true,
                images: true,
                category: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      return {
        userId,
        items: [],
      };
    }

    return {
      id: wishlist.id,
      _id: wishlist.id,
      userId: wishlist.userId,
      items: wishlist.items.map((wi) => ({
        ...wi.item,
        id: wi.item.id,
        _id: wi.item.id,
      })),
    };
  }

  public static async addToWishlist(userId: string, itemId: string): Promise<void> {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status !== ItemStatus.approved) {
      throw new Error('Only approved items can be added to wishlist');
    }

    // Ensure wishlist container exists for user
    const wishlist = await prisma.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Add item relation
    await prisma.wishlistItem.upsert({
      where: {
        wishlistId_itemId: {
          wishlistId: wishlist.id,
          itemId,
        },
      },
      create: {
        wishlistId: wishlist.id,
        itemId,
      },
      update: {},
    });
  }

  public static async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return;

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        itemId,
      },
    });
  }
}
