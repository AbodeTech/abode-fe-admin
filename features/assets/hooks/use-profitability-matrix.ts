'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { ProfitabilityMatrixSchema } from '../schemas/profitability-matrix.schema';
import { assetKeys } from './query-keys';

/** GET /admin/assets/:assetId/profitability/matrix(?as_of=) — one row per offer_type/size/tenor. */
export const useProfitabilityMatrix = (assetId: string, asOf?: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.profitabilityMatrix(assetId, asOf),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/profitability/matrix`, ProfitabilityMatrixSchema, {
        params: asOf ? { as_of: asOf } : undefined,
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
