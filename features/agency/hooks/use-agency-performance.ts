'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { AgencyInventoryRowSchema, AgencyPerformanceSchema } from '../schemas/agency-performance.schema';
import { agencyKeys } from './query-keys';

/** `GET /admin/agencies/:agency_id/stats` (item 8). */
export const useAgencyPerformance = (agencyId: string) =>
  useQuery({
    queryKey: [...agencyKeys.detail(agencyId), 'stats'] as const,
    queryFn: () => apiGet(`/admin/agencies/${agencyId}/stats`, AgencyPerformanceSchema),
    enabled: !!agencyId,
    retry: false,
  });

/**
 * The land the agency's clients bought: `GET /admin/sales/analytics/by-asset`
 * scoped by `agency_id` (item 7).
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
    enabled: !!agencyId,
    retry: false,
  });
