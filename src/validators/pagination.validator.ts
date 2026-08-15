import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => {
    if (!val) return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 1 : Math.max(1, parsed);
  }),
  limit: z.string().optional().transform((val) => {
    if (!val) return 10;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 10 : Math.min(100, Math.max(1, parsed));
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
