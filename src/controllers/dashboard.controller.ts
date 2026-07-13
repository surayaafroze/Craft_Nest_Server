import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DashboardService } from '../services/dashboard.service';

export const getOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const overview = await DashboardService.getDashboardOverview(req.user.userId);
    
    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
};
