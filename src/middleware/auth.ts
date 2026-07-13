import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Role } from '../constants/roles';

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
    }
  } catch (error) {
    // Silently fail for optional auth
  } finally {
    next();
  }
};
