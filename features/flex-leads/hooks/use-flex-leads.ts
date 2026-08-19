'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { FlexLeadCountsSchema, FlexLeadListSchema } from '../schemas/flex-lead.schema';
import { flexLeadKeys, type FlexLeadListFilters } from './query-keys';

/** The BE defaults to 25 and caps at 100. */
export const DEFAULT_FLEX_LEADS_LIMIT = 25;

/**
 * GET /admin/flex-leads — newest first. `q` searches full_name, email and
 * phone server-side (regex-escaped there, so a pasted `+234` is safe — FL-15).
 */
export const useFlexLeads = (filters?: FlexLeadListFilters) => {
  const { page = 1, limit = DEFAULT_FLEX_LEADS_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: flexLeadKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGet('/admin/flex-leads', FlexLeadListSchema, {
        params: {
          page,
          limit,
          status: rest.status,
          type: rest.type,
          q: rest.q || undefined,
          include_deleted: rest.include_deleted ? 'true' : undefined,
        },
      }),
  });
};

/** GET /admin/flex-leads/counts — the five status tiles. */
export const useFlexLeadCounts = () =>
  useQuery({
    queryKey: flexLeadKeys.counts(),
    queryFn: () => apiGet('/admin/flex-leads/counts', FlexLeadCountsSchema),
    staleTime: 30_000,
  });
