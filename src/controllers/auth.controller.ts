import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const usersCollection = getDb().collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
