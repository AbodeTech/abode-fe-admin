import type { PageMeta } from '@/lib/api-client';

/**
 * Wrap rows the way a paginated BE response looks to `apiGetPaged`: rows in
 * `data`, pagination in `meta`. Slices according to the request's page/limit
 * so mock pagination behaves like the real thing.
 */
export function paged<T>(
  rows: readonly T[],
  query: Record<string, unknown>,
  defaultLimit = 20
): { data: T[]; meta: PageMeta } {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.max(1, Number(query.limit ?? defaultLimit) || defaultLimit);
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit) as T[],
    meta: {
      total: rows.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(rows.length / limit)),
    },
  };
}

/** Body accessor with the same ergonomics the old handlers had for variables. */
export function body<T extends Record<string, unknown>>(raw: unknown): T {
  return (raw ?? {}) as T;
}
