import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { WishlistService } from '../services/wishlist.service';
import { ObjectId } from 'mongodb';

export const getWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const wishlist = await WishlistService.getWishlist(req.user.userId);
    res.status(200).json({ wishlist });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const itemId = req.params.itemId as string;
    
    if (!ObjectId.isValid(itemId)) {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    
    try {
      await WishlistService.addToWishlist(req.user.userId, itemId);
      res.status(200).json({ message: 'Item added to wishlist successfully' });
    } catch (err: any) {
      if (err.message === 'Item not found') {
        res.status(404).json({ error: 'Item not found' });
      } else if (err.message === 'Only approved items can be added to wishlist') {
        res.status(400).json({ error: err.message });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const itemId = req.params.itemId as string;
    
    if (!ObjectId.isValid(itemId)) {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    
    await WishlistService.removeFromWishlist(req.user.userId, itemId);
    res.status(200).json({ message: 'Item removed from wishlist successfully' });
  } catch (error) {
    next(error);
  }
};
