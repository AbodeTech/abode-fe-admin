'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { EstateUpdateSchema, type EstateUpdateStatus } from '../schemas/estate-update.schema';
import { assetKeys } from './query-keys';

export const DEFAULT_ESTATE_UPDATES_LIMIT = 20;

/** Mirrors `ListEstateUpdatesQueryDto` — a param it doesn't declare is a hard 400. */
export type EstateUpdatesFilters = {
  page?: number;
  limit?: number;
  /** `null` or unset lists every status. */
  status?: EstateUpdateStatus | null;
};

/**
 * GET /admin/assets/:id/updates — every update on one estate, drafts and
 * archived included, newest created first. `view_estate_updates`.
 *
 * The BE caps `limit` at 100. Pass `enabled: false` when the admin lacks the
 * permission, so the tab renders its no-permission card instead of a 403.
 */
export const useEstateUpdates = (
  assetId: string,
  filters: EstateUpdatesFilters & { enabled?: boolean } = {}
) => {
  const params = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_ESTATE_UPDATES_LIMIT,
    status: filters.status || undefined,
  };

  return useQuery({
    queryKey: assetKeys.estateUpdateList(assetId, params),
    enabled: Boolean(assetId) && (filters.enabled ?? true),
    queryFn: () => apiGetPaged(`/admin/assets/${assetId}/updates`, EstateUpdateSchema, { params }),
  });
};

/**
 * GET /admin/assets/:id/updates/:updateId — one update. `view_estate_updates`.
 *
 * An update that belongs to another asset is a 404 `ESTATE_UPDATE_NOT_FOUND`,
 * the same as a missing one, so a stale id in the URL can't read across estates.
 */
export const useEstateUpdate = (
  assetId: string,
  updateId: string | null | undefined,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: assetKeys.estateUpdate(assetId, updateId ?? ''),
    enabled: Boolean(assetId && updateId) && (options.enabled ?? true),
    queryFn: () => apiGet(`/admin/assets/${assetId}/updates/${updateId}`, EstateUpdateSchema),
  });
