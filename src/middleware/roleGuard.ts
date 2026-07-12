import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const roleGuard = (allowedRoles: Array<'user' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
};
