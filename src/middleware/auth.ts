import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Role } from '../constants/roles';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

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

    // 1. Prioritize Authorization Header (sent directly by frontend API client)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Second preference: backend_jwt Cookie
    if (!token && req.cookies && req.cookies.backend_jwt) {
      token = req.cookies.backend_jwt;
    }

    // 3. Fallback regex manual cookie parsing
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;)\s*backend_jwt\s*=\s*([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
        };
        return next();
      } catch (tokenErr) {
        // If the primary token failed verification (e.g. expired cookie), try Bearer header if cookie was used
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          const headerToken = req.headers.authorization.split(' ')[1];
          try {
            const decoded = verifyToken(headerToken);
            req.user = {
              userId: decoded.userId,
              role: decoded.role,
            };
            return next();
          } catch (e) {}
        }
      }
    }

    // 4. Fallback: Check better-auth session cookie if present
    const baToken = req.cookies && (req.cookies['better-auth.session_data'] || req.cookies['__Secure-better-auth.session_data']);
    if (baToken) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || '';
        const decodedBA: any = jwt.verify(baToken, JWT_SECRET);
        const userId = decodedBA?.user?.id || decodedBA?.session?.userId;
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (user) {
            req.user = {
              userId: user.id,
              role: (user.role as Role) || 'user',
            };
            return next();
          }
        }
      } catch (e) {}
    }

    res.status(401).json({ error: 'Access denied. Invalid, expired, or missing JWT token.' });
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

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.cookies && req.cookies.backend_jwt) {
      token = req.cookies.backend_jwt;
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;)\s*backend_jwt\s*=\s*([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
        };
      } catch (e) {}
    } else {
      const baToken = req.cookies && (req.cookies['better-auth.session_data'] || req.cookies['__Secure-better-auth.session_data']);
      if (baToken) {
        try {
          const JWT_SECRET = process.env.JWT_SECRET || '';
          const decodedBA: any = jwt.verify(baToken, JWT_SECRET);
          const userId = decodedBA?.user?.id || decodedBA?.session?.userId;
          if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
              req.user = {
                userId: user.id,
                role: (user.role as Role) || 'user',
              };
            }
          }
        } catch (e) {}
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  } finally {
    next();
  }
};
