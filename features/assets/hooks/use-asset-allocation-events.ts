'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { AssetAllocationEventSchema } from '../schemas/allocation-event.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/company-events?asset_id=&type=allocation — the SAME real
 * endpoint features/company-events/ already owns, called directly rather
 * than through that feature's hook (no cross-feature imports; see
 * allocation-event.schema.ts's header). `asset_id` filtering is already
 * supported server-side.
 */
export const useAssetAllocationEvents = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: [...assetKeys.detail(assetId), 'allocation-events'] as const,
    queryFn: () =>
      apiGetPaged('/admin/company-events', AssetAllocationEventSchema, {
        params: { asset_id: assetId, type: 'allocation', limit: 5, page: 1 },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
