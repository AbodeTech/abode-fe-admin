'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { EstateProfitabilitySchema } from '../schemas/estate-profitability.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/assets/:assetId/profitability(?as_of=) — the real backend's one
 * calculation. There is no client-side accounting-basis toggle anymore
 * (budget/committed/actual/forecast): the real model recognises exactly one
 * number, an approved incurred/reversal/adjustment event.
 */
export const useEstateProfitability = (assetId: string, asOf?: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.estateProfitability(assetId, asOf),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/profitability`, EstateProfitabilitySchema, {
        params: asOf ? { as_of: asOf } : undefined,
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
