import { z } from 'zod';

export const itemIdSchema = z.object({
  params: z.object({
    itemId: z.string().min(1, {
      message: 'Invalid item ID format',
    }),
  }),
});
