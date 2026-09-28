'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPut } from '@/lib/api-client';

import { LandConfigurationSchema, type LandConfigurationFormOutput } from '../schemas/land-configuration.schema';
import { assetKeys } from './query-keys';

/**
 * PUT /admin/assets/:assetId/land-configuration — the editor's one
 * complete-replacement save. Optimistic concurrency via `expected_version`:
 * a stale save 409s `LAND_CONFIGURATION_VERSION_CONFLICT` instead of quietly
 * overwriting a newer one (see the mock's own repro instructions in
 * lib/mocks/routes/land-configuration.ts).
 *
 * `onSuccess` ALWAYS invalidates and refetches rather than trusting the PUT
 * response as the new cache value — two confirmed real backend bugs make
 * that response unsafe to cache directly:
 *
 *  1. A newly-created non-saleable row echoes `id: null` (see
 *     AssetLandUseSchema's doc comment) — caching it would mean the next
 *     save resubmits that row with no id, silently duplicating it.
 *  2. Every product's `sizes[]`/`configured_sqm` comes back empty/zeroed on
 *     EVERY save, full stop — `replaceConfiguration()` computes its response
 *     from the submitted DTO (which never carries size data at all) rather
 *     than reloading the asset's real, untouched size documents the way GET
 *     does. Caching this would make the Overview card/editor show "0
 *     configured, no sizes" for every product until the page is manually
 *     reloaded, even though nothing about the sizes actually changed.
 *
 * A fresh GET is the only response that reloads real sizes from the DB, so
 * this hook no longer tries to shortcut it. `onError` does NOT touch the
 * cache on a 409: the whole point of optimistic concurrency is that the
 * caller decides "review the latest version" vs. "keep editing", never that
 * the hook silently discards the admin's unsaved input.
 */
export const useSaveLandConfiguration = (assetId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LandConfigurationFormOutput) =>
      apiPut(`/admin/assets/${assetId}/land-configuration`, values, LandConfigurationSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.landConfiguration(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.landConfigurationHistory(assetId) });
      // total_land_sqm/land_inventory_state/land_configuration_version live
      // on the asset root too — refresh the header/overview and the list row.
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};
