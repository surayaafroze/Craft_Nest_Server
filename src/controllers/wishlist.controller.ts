import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const db = getDb();
    const wishlistsCollection = db.collection('wishlists');
    const userIdObj = new ObjectId(req.user.userId);

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
                  imageUrls: '$$item.imageUrls',
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
      res.status(200).json({
        wishlist: {
          userId: req.user.userId,
          items: [],
        },
      });
      return;
    }

    const w = wishlist[0];
    res.status(200).json({
      wishlist: {
        id: w._id.toString(),
        userId: w.userId.toString(),
        items: w.items.map((item: any) => ({
          ...item,
          id: item.id.toString(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;
    if (!itemId || typeof itemId !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const db = getDb();
    const itemsCollection = db.collection('items');
    const wishlistsCollection = db.collection('wishlists');

    let itemIdObj: ObjectId;
    try {
      itemIdObj = new ObjectId(itemId);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const item = await itemsCollection.findOne({ _id: itemIdObj });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const userIdObj = new ObjectId(req.user.userId);

    await wishlistsCollection.updateOne(
      { userId: userIdObj },
      {
        $addToSet: { itemIds: itemIdObj },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    res.status(200).json({ message: 'Item added to wishlist successfully' });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;
    if (!itemId || typeof itemId !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const db = getDb();
    const wishlistsCollection = db.collection('wishlists');

    let itemIdObj: ObjectId;
    try {
      itemIdObj = new ObjectId(itemId);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const userIdObj = new ObjectId(req.user.userId);

    await wishlistsCollection.updateOne(
      { userId: userIdObj },
      {
        $pull: { itemIds: itemIdObj },
        $set: { updatedAt: new Date() },
      } as any
    );

    res.status(200).json({ message: 'Item removed from wishlist successfully' });
  } catch (error) {
    next(error);
  }
};
