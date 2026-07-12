import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics.service';

export const getUserAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const data = await AnalyticsService.getUserAnalytics(req.user.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getPlatformAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const data = await AnalyticsService.getPlatformAnalytics();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
