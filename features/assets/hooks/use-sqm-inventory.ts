'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { SqmInventorySchema } from '../schemas/sqm-inventory.schema';
import { SqmReconciliationSchema } from '../schemas/sqm-reconciliation.schema';
import { assetKeys } from './query-keys';

/** GET /admin/assets/:assetId/sqm-inventory — the live ledger position, if this estate has one. */
export const useSqmInventory = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.sqmInventory(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/sqm-inventory`, SqmInventorySchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/**
 * GET .../sqm-inventory/reconciliation — the dry-run readiness check. Safe to
 * call even once already active (the backend just re-runs the same
 * calculation), which is how the panel keeps showing an up-to-date report
 * after activation.
 */
export const useSqmReconciliation = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.sqmReconciliation(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/sqm-inventory/reconciliation`, SqmReconciliationSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
