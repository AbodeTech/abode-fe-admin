'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import {
  DEFAULT_SUBSCRIBER_SORT,
  SubscriberRowSchema,
  type SubscriberSortField,
  type SubscriberType,
} from '../schemas/asset-subscribers.schema';
import { assetKeys } from './query-keys';

export const DEFAULT_SUBSCRIBERS_LIMIT = 25;

/** Mirrors `SubscribersQueryDto` — a param it doesn't declare is a hard 400. */
export type AssetSubscribersFilters = {
  page?: number;
  limit?: number;
  /** Plot size in sqm. */
  size?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  subscriberType?: SubscriberType | null;
  /** Matches buyer name, email or phone. */
  q?: string | null;
  sortBy?: SubscriberSortField;
  sortDir?: 'asc' | 'desc';
};

/**
 * Shared by the list and the CSV export so the file always covers exactly what
 * the table is showing. The export ignores `page`/`limit` by design, but keeps
 * the ordering.
 */
export function buildSubscribersParams(filters: AssetSubscribersFilters) {
  return {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_SUBSCRIBERS_LIMIT,
    size: filters.size ?? undefined,
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
    subscriber_type: filters.subscriberType || undefined,
    q: filters.q?.trim() || undefined,
    sort_by: filters.sortBy || DEFAULT_SUBSCRIBER_SORT,
    sort_dir: filters.sortDir || 'desc',
  };
}

/**
 * GET /admin/assets/:id/subscribers — who bought into this asset.
 * `view_asset_subscribers`.
 *
 * The BE's `aggregates` block does not survive the response envelope (see the
 * note on `asset-subscribers.schema.ts`), so only rows and `meta` come back.
 */
export const useAssetSubscribers = (
  assetId: string,
  filters: AssetSubscribersFilters & { enabled?: boolean } = {}
) => {
  const { enabled = true, ...rest } = filters;
  const params = buildSubscribersParams(rest);

  return useQuery({
    queryKey: assetKeys.assetSubscribers(assetId, params),
    enabled: Boolean(assetId) && enabled,
    queryFn: () =>
      apiGetPaged(`/admin/assets/${assetId}/subscribers`, SubscriberRowSchema, { params }),
  });
};
