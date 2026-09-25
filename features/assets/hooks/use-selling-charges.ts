'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { SellingChargesHistoryEntrySchema, SellingChargesSchema } from '../schemas/selling-charges.schema';
import { assetKeys } from './query-keys';

/** GET /admin/assets/:assetId/selling-charges — `null` until a first version has ever been approved. */
export const useSellingCharges = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.sellingCharges(assetId),
    queryFn: () => apiGet(`/admin/assets/${assetId}/selling-charges`, SellingChargesSchema),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });

/** GET .../selling-charges/history — every approved version, oldest first, not paginated on the real backend. */
export const useSellingChargesHistory = (assetId: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.sellingChargesHistory(assetId),
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/selling-charges/history`, z.array(SellingChargesHistoryEntrySchema)),
    enabled: Boolean(assetId) && (options.enabled ?? true),
  });
