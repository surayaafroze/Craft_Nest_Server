import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int({ message: 'Rating must be an integer' })
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating must be at most 5' }),
  comment: z.string().min(3, { message: 'Comment must be at least 3 characters long' }),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int({ message: 'Rating must be an integer' })
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating must be at most 5' })
    .optional(),
  comment: z.string().min(3, { message: 'Comment must be at least 3 characters long' }).optional(),
}).refine(data => data.rating !== undefined || data.comment !== undefined, {
  message: 'At least one field (rating or comment) must be provided for update',
});
