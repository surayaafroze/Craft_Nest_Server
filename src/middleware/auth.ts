import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Role } from '../constants/roles';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db';
import { ObjectId } from 'mongodb';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | null = null;

    // 1. Try reading from cookie directly (since we have cookie-parser)
    if (req.cookies && req.cookies.backend_jwt) {
      token = req.cookies.backend_jwt;
    }

    // 2. Try reading from Authorization Header (useful for API testing e.g. Postman)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    // 3. Fallback regex manual cookie parsing just in case cookie-parser missed it
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;)\s*backend_jwt\s*=\s*([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      const baToken = req.cookies && (req.cookies['better-auth.session_data'] || req.cookies['__Secure-better-auth.session_data']);
      if (baToken) {
        try {
          const JWT_SECRET = process.env.JWT_SECRET || '';
          const decodedBA: any = jwt.verify(baToken, JWT_SECRET);
          const userId = decodedBA?.user?.id || decodedBA?.session?.userId;
          if (userId) {
            const user = await getDb().collection('users').findOne({ _id: new ObjectId(userId) });
            if (user) {
              req.user = {
                userId: user._id.toString(),
                role: (user.role as Role) || 'user',
              };
              return next();
            }
          }
        } catch (e) {
          // Fall back to the 401 error below
        }
      }
      res.status(401).json({ error: 'Access denied. No backend JWT token provided.' });
      return;
    }

    const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | null = null;

    if (req.cookies && req.cookies.backend_jwt) {
      token = req.cookies.backend_jwt;
    }
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;)\s*backend_jwt\s*=\s*([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    } else {
      const baToken = req.cookies && (req.cookies['better-auth.session_data'] || req.cookies['__Secure-better-auth.session_data']);
      if (baToken) {
        const JWT_SECRET = process.env.JWT_SECRET || '';
        const decodedBA: any = jwt.verify(baToken, JWT_SECRET);
        const userId = decodedBA?.user?.id || decodedBA?.session?.userId;
        if (userId) {
          const user = await getDb().collection('users').findOne({ _id: new ObjectId(userId) });
          if (user) {
            req.user = {
              userId: user._id.toString(),
              role: (user.role as Role) || 'user',
            };
          }
        }
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  } finally {
    next();
  }
};
