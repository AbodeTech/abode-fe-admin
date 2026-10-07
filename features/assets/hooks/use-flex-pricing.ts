'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet, apiPost, apiPut } from '@/lib/api-client';

import {
  PricingDraftSchema,
  PricingVersionSchema,
  SizePricingResponseSchema,
  type PricingPayload,
  type PublishPricingPayload,
} from '../schemas/flex-pricing.schema';
import { assetKeys } from './query-keys';

/* ============================================================
 * Flex 2.0 base-plan pricing — docs/FLEX-2.0-ENDPOINTS.pdf §3.2.
 *
 * Every route lives under /admin/assets/:assetId/offers/flex/sizes/:sizeId/pricing.
 * The editor previews instantly in the browser (lib/flex-pricing.ts), so
 * POST …/pricing/preview has no hook: it exists to prove the server agrees with
 * that engine, which scripts/flex-pricing-mock-qa.ts asserts against the mock
 * and a backend contract test should assert against the real thing.
 *
 * GET …/pricing/versions and DELETE …/pricing/draft are likewise not wired — the designed History sheet
 * reads the offers/history log, which already carries each pricing entry, and
 * the designed editor has no “discard draft” control.
 * ============================================================ */

const base = (assetId: string, sizeId: string) => `/admin/assets/${assetId}/offers/flex/sizes/${sizeId}/pricing`;

export const useSizePricing = (assetId: string, sizeId: string | null, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: assetKeys.flexPricing(assetId, sizeId ?? ''),
    queryFn: () => apiGet(base(assetId, sizeId as string), SizePricingResponseSchema),
    enabled: Boolean(assetId && sizeId) && (options.enabled ?? true),
  });

/**
 * Every pricing write changes what the Offers tab shows (mode, live version,
 * summary, “has draft”) and adds to the history log, so each invalidates the
 * whole asset subtree — the pricing, detail and history keys all hang off it —
 * and the list row's offer counts.
 */
function usePricingMutation<TVariables, TData>(
  assetId: string,
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

/** PUT …/pricing/draft — one shared draft per size, replaced on every save. */
export const useSavePricingDraft = (assetId: string, sizeId: string) =>
  usePricingMutation(assetId, (payload: PricingPayload) => apiPut(`${base(assetId, sizeId)}/draft`, payload, PricingDraftSchema));

/**
 * POST …/pricing/publish — creates the next immutable version. Existing and
 * pending purchases are untouched. `expected_live_version` is what the editor
 * was opened on; a 409 PRICING_VERSION_CONFLICT means another admin published
 * first.
 */
export const usePublishPricing = (assetId: string, sizeId: string) =>
  usePricingMutation(assetId, (payload: PublishPricingPayload) =>
    apiPost(`${base(assetId, sizeId)}/publish`, payload, PricingVersionSchema)
  );

const ConvertResultSchema = z.object({ version: PricingVersionSchema });

/** POST …/pricing/convert-legacy — a tenor-list size becomes a base plan at v1. Existing buyers keep their plans. */
export const useConvertLegacyPricing = (assetId: string, sizeId: string) =>
  usePricingMutation(assetId, (payload: PricingPayload) =>
    apiPost(`${base(assetId, sizeId)}/convert-legacy`, payload, ConvertResultSchema)
  );
