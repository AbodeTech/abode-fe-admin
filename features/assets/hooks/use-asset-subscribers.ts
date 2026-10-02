'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPagedWithAggregates } from '@/lib/api-client';

import {
  DEFAULT_SUBSCRIBER_SORT,
  SubscriberAggregatesSchema,
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
 * Rows, pagination and filtered-set aggregates are returned together.
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
      apiGetPagedWithAggregates(
        `/admin/assets/${assetId}/subscribers`,
        SubscriberRowSchema,
        SubscriberAggregatesSchema,
        { params }
      ),
  });
};
