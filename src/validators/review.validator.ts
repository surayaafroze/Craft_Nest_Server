import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int({ message: 'Rating must be an integer' })
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating must be at most 5' }),
  comment: z.string().min(3, { message: 'Comment must be at least 3 characters long' }),
});
