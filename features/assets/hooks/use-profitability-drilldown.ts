'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { ProfitabilityDrillDownSchema } from '../schemas/profitability-drilldown.schema';
import { assetKeys } from './query-keys';

/** GET /admin/assets/:assetId/profitability/drill-down(?as_of=) — "show your work" for the profitability card. */
export const useProfitabilityDrillDown = (assetId: string, asOf?: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.profitabilityDrillDown(assetId, asOf),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/profitability/drill-down`, ProfitabilityDrillDownSchema, {
        params: asOf ? { as_of: asOf } : undefined,
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
