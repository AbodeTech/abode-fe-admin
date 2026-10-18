'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CommissionConfigResponseSchema } from '../schemas/commission.schema';
import { commissionKeys } from './query-keys';

/**
 * GET /admin/commission/config — the active config plus recent versions.
 *
 * One request serves both the rates card and the version history section, so
 * they share a cache entry and can never disagree about which version is live.
 */
export const useCommissionConfig = () =>
  useQuery({
    queryKey: commissionKeys.config(),
    queryFn: () => apiGet('/admin/commission/config', CommissionConfigResponseSchema),
  });
