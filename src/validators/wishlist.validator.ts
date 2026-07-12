import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const itemIdSchema = z.object({
  params: z.object({
    itemId: z.string().refine((val) => ObjectId.isValid(val), {
      message: 'Invalid item ID format',
    }),
  }),
});
