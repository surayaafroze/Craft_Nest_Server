import { z } from 'zod';

export const submitContactSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    subject: z.string().min(5).max(150),
    message: z.string().min(10).max(2000),
  }),
});

export const updateContactStatusSchema = z.object({
  body: z.object({
    status: z.enum(['new', 'read', 'responded']),
  }),
});
