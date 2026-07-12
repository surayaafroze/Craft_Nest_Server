import { Router } from 'express';
import { createBlog, updateBlog, deleteBlog, getBlogList, getBlogBySlug } from '../controllers/blog.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator';

const router = Router();

// Public routes
router.get('/', getBlogList);
router.get('/:slug', getBlogBySlug);

// Admin-only routes
router.post('/', requireAuth, validate(createBlogSchema), createBlog as any);
router.put('/:slug', requireAuth, validate(updateBlogSchema), updateBlog as any);
router.delete('/:slug', requireAuth, deleteBlog as any);

export default router;
