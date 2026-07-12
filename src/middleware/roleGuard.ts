import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { AuthenticatedRequest } from './auth';
import { Role, ROLES } from '../constants/roles';

export const roleGuard = (allowedRoles: Role | Role[]) => {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!rolesArray.includes(req.user.role)) {
      res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const adminOnly = roleGuard(ROLES.ADMIN);

export interface OwnerOrAdminOptions {
  collection: string;
  ownerField?: string; // defaults to 'ownerId'
  resourceIdParamName?: string; // defaults to 'id'
}

export const ownerOrAdminGuard = (options: OwnerOrAdminOptions) => {
  const ownerField = options.ownerField || 'ownerId';
  const resourceIdParamName = options.resourceIdParamName || 'id';

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Admins bypass resource ownership checks
      if (req.user.role === ROLES.ADMIN) {
        next();
        return;
      }

      const resourceId = req.params[resourceIdParamName];
      if (!resourceId || typeof resourceId !== 'string') {
        res.status(400).json({ error: 'Resource identifier is missing or invalid' });
        return;
      }

      let objectId: ObjectId;
      try {
        objectId = new ObjectId(resourceId);
      } catch {
        res.status(400).json({ error: 'Invalid resource ID format' });
        return;
      }

      const db = getDb();
      const resource = await db.collection(options.collection).findOne({ _id: objectId });

      if (!resource) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }

      const ownerId = resource[ownerField];
      if (!ownerId) {
        res.status(403).json({ error: 'Resource owner cannot be verified' });
        return;
      }

      const ownerIdStr = ownerId instanceof ObjectId ? ownerId.toString() : ownerId;
      if (ownerIdStr !== req.user.userId) {
        res.status(403).json({ error: 'Access forbidden. You do not own this resource.' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
