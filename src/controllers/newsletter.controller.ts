import { Request, Response, NextFunction } from 'express';
import { NewsletterService } from '../services/newsletter.service';

export const subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    try {
      await NewsletterService.subscribe(email);
      res.status(200).json({ message: 'Successfully subscribed to the newsletter' });
    } catch (err: any) {
      if (err.message === 'Email is already subscribed') {
        res.status(400).json({ error: err.message });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
};
