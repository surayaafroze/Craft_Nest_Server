import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { signToken, verifyToken } from '../utils/jwt';

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

export const syncSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Better Auth's jwt() plugin stores the JWT in the 'session_data' cookie, not 'session_token'
    const sessionToken = req.cookies['better-auth.session_data'] || req.cookies['__Secure-better-auth.session_data'];
    
    if (!sessionToken) {
      res.status(400).json({ error: 'No Better Auth session data token found.' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(sessionToken, JWT_SECRET);
    } catch (err) {
      console.error("JWT Verification failed in syncSession:", err);
      res.status(401).json({ error: 'Invalid Better Auth session token.', details: err instanceof Error ? err.message : String(err) });
      return;
    }

    const userId = decoded?.user?.id || decoded?.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Invalid token payload.' });
      return;
    }

    const usersCollection = getDb().collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const backendToken = signToken({
      userId: user._id.toString(),
      role: user.role || 'user',
    });

    res.cookie('backend_jwt', backendToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: 'Session synchronized successfully.' });
  } catch (error: any) {
    console.error("Error in syncSession:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error?.message, stack: error?.stack });
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('backend_jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};
