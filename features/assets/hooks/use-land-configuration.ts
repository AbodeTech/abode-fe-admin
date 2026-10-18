'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import {
  LandConfigurationHistoryEntrySchema,
  LandConfigurationRevisionSchema,
  LandConfigurationSchema,
} from '../schemas/land-configuration.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/assets/:assetId/land-configuration — the current land account.
 * Every read surface (Overview's Land Account card, the editor drawer)
 * shares this one query.
 */
export const useLandConfiguration = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.landConfiguration(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/land-configuration`, LandConfigurationSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

const HISTORY_LIMIT = 50;

/**
 * GET /admin/assets/:assetId/land-configuration/history — every revision,
 * newest first, as lightweight summary rows only. Full before/after
 * snapshots are a separate request per version (`useLandConfigurationRevision`
 * below) — the history sheet fetches one on demand when a row is expanded.
 */
export const useLandConfigurationHistory = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.landConfigurationHistory(assetId),
    queryFn: () =>
      apiGetPaged(`/admin/assets/${assetId}/land-configuration/history`, LandConfigurationHistoryEntrySchema, {
        params: { page: 1, limit: HISTORY_LIMIT },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/** GET .../history/:version — one revision, for deep-linking a specific version. */
export const useLandConfigurationRevision = (
  assetId: string,
  version: number | null | undefined,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: assetKeys.landConfigurationRevision(assetId, version ?? -1),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/land-configuration/history/${version}`, LandConfigurationRevisionSchema),
    enabled: Boolean(assetId) && version != null && (options.enabled ?? true),
  });
