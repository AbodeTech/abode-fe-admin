'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import {
  ASSET_HISTORY_KIND_LABELS,
  FieldHistoryRowSchema,
  boundaryHistoryEntries,
  costHistoryEntries,
  eventHistoryEntries,
  fieldHistoryEntries,
  landHistoryEntries,
  mergeAssetHistory,
  type AssetHistoryKind,
} from '../schemas/asset-history.schema';
import { assetKeys } from './query-keys';
import { useAssetAllocationEvents } from './use-asset-allocation-events';
import { useCostLedger } from './use-cost-ledger';
import { useLandConfigurationHistory } from './use-land-configuration';
import { useBoundaryHistory } from './use-site-setup';

/** The field-history endpoint's own default and maximum useful page. */
const FIELD_HISTORY_LIMIT = 100;

/** GET /admin/assets/:assetId/field-history — verified field work on this estate, newest first. */
export const useFieldHistory = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: [...assetKeys.detail(assetId), 'field-history'] as const,
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/field-history`, z.array(FieldHistoryRowSchema), {
        params: { limit: FIELD_HISTORY_LIMIT },
      }),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/**
 * The estate's history, merged from the active backend history sources (see
 * `asset-history.schema.ts`).
 *
 * Each source has its own permission and can fail on its own, so they are
 * read independently: the timeline shows whatever did load, and `missing`
 * names the areas it does not cover and why, instead of the whole tab
 * failing or silently looking complete.
 */
export function useAssetHistory(assetId: string) {
  const permissions = useAdminPermissions();
  const can = {
    assets: permissions.has('view_assets'),
    costs: permissions.has('view_asset_costs'),
    field: permissions.has('view_field_performance'),
    allocations: permissions.has('view_allocations'),
  };

  const land = useLandConfigurationHistory(assetId, { enabled: can.assets });
  const boundary = useBoundaryHistory(assetId, { enabled: can.field });
  const field = useFieldHistory(assetId, { enabled: can.field });
  const costs = useCostLedger(assetId, { enabled: can.costs });
  const events = useAssetAllocationEvents(assetId, { enabled: can.allocations });

  const sources: { kind: AssetHistoryKind; allowed: boolean; isLoading: boolean; error: unknown }[] = [
    { kind: 'land', allowed: can.assets, isLoading: land.isLoading, error: land.error },
    { kind: 'boundary', allowed: can.field, isLoading: boundary.isLoading, error: boundary.error },
    { kind: 'field', allowed: can.field, isLoading: field.isLoading, error: field.error },
    { kind: 'cost', allowed: can.costs, isLoading: costs.isLoading, error: costs.error },
    { kind: 'event', allowed: can.allocations, isLoading: events.isLoading, error: events.error },
  ];

  const entries = mergeAssetHistory(
    landHistoryEntries(land.data?.items ?? []),
    boundaryHistoryEntries(boundary.data ?? []),
    fieldHistoryEntries(field.data ?? []),
    costHistoryEntries(costs.history),
    eventHistoryEntries(events.data?.items ?? [])
  );

  return {
    entries,
    isLoading: sources.some((source) => source.allowed && source.isLoading),
    missing: sources
      .filter((source) => !source.allowed || source.error)
      .map((source) => ({
        kind: source.kind,
        label: ASSET_HISTORY_KIND_LABELS[source.kind],
        reason: !source.allowed
          ? 'no permission'
          : source.error instanceof Error
            ? source.error.message
            : 'could not be loaded',
      })),
  };
}
