'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';
import { isBackendReady } from '@/lib/backend-ready';

import { AgencyInventoryRowSchema, AgencyPerformanceSchema } from '../schemas/agency-performance.schema';
import { agencyKeys } from './query-keys';

/** Proposed `GET /admin/agencies/:agency_id/stats` (item 8). Off until `agency_stats` is ready. */
export const useAgencyPerformance = (agencyId: string) =>
  useQuery({
    queryKey: [...agencyKeys.detail(agencyId), 'stats'] as const,
    queryFn: () => apiGet(`/admin/agencies/${agencyId}/stats`, AgencyPerformanceSchema),
    enabled: !!agencyId && isBackendReady('agency_stats'),
    retry: false,
  });

/**
 * The land the agency's clients bought: `GET /admin/sales/analytics/by-asset`
 * scoped by the proposed `agency_id` (item 7). Today's BE 400s on that param,
 * so it stays off until `agency_sales` is ready.
 */
export const useAgencyInventory = (agencyId: string) =>
  useQuery({
    queryKey: [...agencyKeys.detail(agencyId), 'inventory'] as const,
    queryFn: async () =>
      (
        await apiGetPaged('/admin/sales/analytics/by-asset', AgencyInventoryRowSchema, {
          params: { agency_id: agencyId },
        })
      ).items,
    enabled: !!agencyId && isBackendReady('agency_sales'),
    retry: false,
  });
