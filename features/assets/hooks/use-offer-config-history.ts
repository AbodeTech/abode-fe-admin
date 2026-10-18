'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { OfferConfigRevisionSchema } from '../schemas/offer-config-history.schema';
import { assetKeys } from './query-keys';

const HISTORY_LIMIT = 50;

/** GET /admin/assets/:assetId/offers/history — every offer/size/plan config change, newest first. */
export const useOfferConfigHistory = (assetId: string, options: { enabled?: boolean; page?: number } = {}) =>
  useQuery({
    queryKey: [...assetKeys.detail(assetId), 'offer-config-history', options.page ?? 1] as const,
    queryFn: () =>
      apiGetPaged(`/admin/assets/${assetId}/offers/history`, OfferConfigRevisionSchema, {
        params: { page: options.page ?? 1, limit: HISTORY_LIMIT },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
