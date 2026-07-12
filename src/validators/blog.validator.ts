import { z } from 'zod';

export const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    slug: z.string().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be url-friendly (lowercase, alphanumeric, hyphens)'),
    coverImage: z.string().url(),
    content: z.string().min(10),
    tags: z.array(z.string()).min(1).max(10),
  }),
});

export const updateBlogSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    slug: z.string().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be url-friendly (lowercase, alphanumeric, hyphens)').optional(),
    coverImage: z.string().url().optional(),
    content: z.string().min(10).optional(),
    tags: z.array(z.string()).min(1).max(10).optional(),
  }),
});
