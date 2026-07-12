import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { verifyGoogleToken } from '../utils/googleAuth';
import { AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const usersCollection = getDb().collection('users');

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      authProvider: 'local',
      googleId: null,
      avatarUrl: null,
      role: 'user',
      bio: '',
      location: '',
      phone: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId.toString();

    const token = signToken({
      userId,
      role: 'user',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const usersCollection = getDb().collection('users');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.authProvider === 'google' && !user.passwordHash) {
      res.status(400).json({ error: 'This email is registered with Google. Please use Google Login.' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash || '');
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Your account has been suspended' });
      return;
    }

    const userId = user._id.toString();
    const token = signToken({
      userId,
      role: user.role || 'user',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idToken } = req.body;
    const googleUser = await verifyGoogleToken(idToken);
    const usersCollection = getDb().collection('users');

    let user = await usersCollection.findOne({
      $or: [
        { googleId: googleUser.googleId },
        { email: googleUser.email.toLowerCase() }
      ]
    });

    let userId: string;
    let userRole: 'user' | 'admin' = 'user';

    if (!user) {
      const newUser = {
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        passwordHash: null,
        authProvider: 'google',
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
        role: 'user',
        bio: '',
        location: '',
        phone: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      userId = result.insertedId.toString();
    } else {
      userId = user._id.toString();
      userRole = user.role || 'user';

      if (user.status === 'suspended') {
        res.status(403).json({ error: 'Your account has been suspended' });
        return;
      }

      if (!user.googleId) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              googleId: googleUser.googleId,
              authProvider: 'google',
              avatarUrl: user.avatarUrl || googleUser.avatarUrl,
              updatedAt: new Date(),
            }
          }
        );
      }
    }

    const token = signToken({
      userId,
      role: userRole,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Google login successful',
      user: {
        id: userId,
        name: user ? user.name : googleUser.name,
        email: googleUser.email,
        role: userRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

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
