import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const submitContactMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    
    const createdMessage = await ContactService.submitMessage({ name, email, subject, message });
    res.status(201).json({ message: 'Message submitted successfully', data: createdMessage });
  } catch (error) {
    next(error);
  }
};

export const getAllMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const messages = await ContactService.getAllMessages();
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const updateMessageStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const id = req.params.id as string;
    const { status } = req.body;
    
    const updated = await ContactService.updateStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    
    res.status(200).json({ message: 'Message status updated', data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const id = req.params.id as string;
    
    const success = await ContactService.deleteMessage(id);
    if (!success) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};
