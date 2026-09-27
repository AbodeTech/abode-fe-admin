'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CostCoverageSchema } from '../schemas/cost-coverage.schema';
import { assetKeys } from './query-keys';

/** GET /admin/assets/:assetId/costs/coverage — how much of this estate's cost is actually known. */
export const useCostCoverage = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.costCoverage(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/costs/coverage`, CostCoverageSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
