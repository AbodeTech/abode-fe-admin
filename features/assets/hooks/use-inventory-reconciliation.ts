'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { InventoryReconciliationSchema } from '../schemas/inventory-reconciliation.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/assets/:assetId/inventory-reconciliation — the physical
 * (Block/Plot) vs. commercial (Analytics) join, by size. A full-estate view,
 * not paginated — row count is bounded by the number of distinct sizes.
 */
export const useInventoryReconciliation = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.inventoryReconciliation(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/inventory-reconciliation`, InventoryReconciliationSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
