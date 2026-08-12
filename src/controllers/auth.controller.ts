import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { signToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { verifyGoogleToken } from '../utils/googleAuth';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as any,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

function formatUserResponse(user: any) {
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    avatarUrl: user.avatarUrl || null,
    bio: user.bio || '',
    location: user.location || '',
    phone: user.phone || '',
    status: user.status || 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        authProvider: 'local',
        role: 'user',
        status: 'active',
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie('backend_jwt', token, getCookieOptions());

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account is suspended. Please contact support.' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie('backend_jwt', token, getCookieOptions());

    res.status(200).json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const idToken = req.body.idToken || req.body.credential || req.body.token;
    if (!idToken) {
      res.status(400).json({ error: 'Google ID token is required.' });
      return;
    }

    const googlePayload = await verifyGoogleToken(idToken);
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googlePayload.googleId },
          { email: googlePayload.email },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googlePayload.name,
          email: googlePayload.email,
          authProvider: 'google',
          googleId: googlePayload.googleId,
          avatarUrl: googlePayload.avatarUrl,
          role: 'user',
          status: 'active',
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googlePayload.googleId,
          authProvider: 'google',
          avatarUrl: user.avatarUrl || googlePayload.avatarUrl,
        },
      });
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account is suspended. Please contact support.' });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie('backend_jwt', token, getCookieOptions());

    res.status(200).json({
      message: 'Google login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Google authentication failed.' });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const syncSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const backendToken = signToken({
      userId: user.id,
      role: user.role || 'user',
    });

    res.cookie('backend_jwt', backendToken, getCookieOptions());

    res.status(200).json({
      message: 'Session synchronized successfully.',
      token: backendToken,
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error("Error in syncSession:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error?.message, stack: error?.stack });
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('backend_jwt', getCookieOptions());
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

