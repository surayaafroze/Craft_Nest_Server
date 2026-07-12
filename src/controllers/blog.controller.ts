import { Request, Response, NextFunction } from 'express';
import { BlogService } from '../services/blog.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const createBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const { title, slug, coverImage, content, tags } = req.body;
    try {
      const blog = await BlogService.createBlog({ title, slug, coverImage, content, tags });
      res.status(201).json({ message: 'Blog post created successfully', blog });
    } catch (err: any) {
      if (err.message === 'Slug must be unique') {
        res.status(400).json({ error: err.message });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const slug = req.params.slug as string;
    
    try {
      const updatedBlog = await BlogService.updateBlog(slug, req.body);
      if (!updatedBlog) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
      }
      res.status(200).json({ message: 'Blog post updated successfully', blog: updatedBlog });
    } catch (err: any) {
      if (err.message === 'Slug must be unique') {
        res.status(400).json({ error: err.message });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const deleteBlog = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const slug = req.params.slug as string;
    
    const success = await BlogService.deleteBlog(slug);
    if (!success) {
      res.status(404).json({ error: 'Blog post not found' });
      return;
    }
    
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBlogList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const blogs = await BlogService.getBlogList();
    res.status(200).json({ blogs });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    
    const blog = await BlogService.getBlogBySlug(slug);
    if (!blog) {
      res.status(404).json({ error: 'Blog post not found' });
      return;
    }
    
    res.status(200).json({ blog });
  } catch (error) {
    next(error);
  }
};
