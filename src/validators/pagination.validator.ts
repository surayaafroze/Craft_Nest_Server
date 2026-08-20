import { z } from 'zod';

export const MAX_PAGINATION_LIMIT = 100;
export const DEFAULT_PAGINATION_LIMIT = 10;

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => {
    if (!val) return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 1 : Math.max(1, parsed);
  }),
  limit: z.string().optional().transform((val) => {
    if (!val) return DEFAULT_PAGINATION_LIMIT;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? DEFAULT_PAGINATION_LIMIT : Math.min(MAX_PAGINATION_LIMIT, Math.max(1, parsed));
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
