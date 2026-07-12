import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { WishlistDocument } from '../types/wishlist';
import { ItemDocument } from '../types/item';

export class WishlistService {
  
  public static async getWishlist(userId: string): Promise<any> {
    const db = getDb();
    const wishlistsCollection = db.collection<WishlistDocument>('wishlists');
    const userIdObj = new ObjectId(userId);

    const wishlist = await wishlistsCollection
      .aggregate([
        { $match: { userId: userIdObj } },
        {
          $lookup: {
            from: 'items',
            localField: 'itemIds',
            foreignField: '_id',
            as: 'items',
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            items: {
              $map: {
                input: '$items',
                as: 'item',
                in: {
                  id: '$$item._id',
                  title: '$$item.title',
                  shortDescription: '$$item.shortDescription',
                  price: '$$item.price',
                  images: '$$item.images', // updated to images based on schema
                  category: '$$item.category',
                  status: '$$item.status',
                },
              },
            },
          },
        },
      ])
      .toArray();

    if (wishlist.length === 0) {
      return {
        userId,
        items: [],
      };
    }

    const w = wishlist[0];
    return {
      id: w._id.toString(),
      userId: w.userId.toString(),
      items: w.items.map((item: any) => ({
        ...item,
        id: item.id.toString(),
      })),
    };
  }

  public static async addToWishlist(userId: string, itemId: string): Promise<void> {
    const db = getDb();
    const itemsCollection = db.collection<ItemDocument>('items');
    const wishlistsCollection = db.collection<WishlistDocument>('wishlists');

    const itemIdObj = new ObjectId(itemId);
    const userIdObj = new ObjectId(userId);

    const item = await itemsCollection.findOne({ _id: itemIdObj });
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Only approved items can be added to wishlist
    if (item.status !== 'approved') {
      throw new Error('Only approved items can be added to wishlist');
    }

    await wishlistsCollection.updateOne(
      { userId: userIdObj },
      {
        $addToSet: { itemIds: itemIdObj },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      } as any,
      { upsert: true }
    );
  }

  public static async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    const db = getDb();
    const wishlistsCollection = db.collection<WishlistDocument>('wishlists');

    const itemIdObj = new ObjectId(itemId);
    const userIdObj = new ObjectId(userId);

    await wishlistsCollection.updateOne(
      { userId: userIdObj },
      {
        $pull: { itemIds: itemIdObj },
        $set: { updatedAt: new Date() },
      } as any
    );
  }
}
