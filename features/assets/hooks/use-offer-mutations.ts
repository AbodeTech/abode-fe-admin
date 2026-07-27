'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';

import type { Plan } from '../schemas/asset-detail.schema';
import type { OfferType } from '../schemas/asset.schema';
import { assetKeys } from './query-keys';

/* ============================================================
 * The nested edit surface.
 *
 * Six endpoints, addressed by position rather than id at two levels:
 *
 *   PATCH  …/offers/:offerType                     offer settings
 *   POST   …/offers/:offerType/sizes               add a size (with its plans)
 *   PATCH  …/offers/:offerType/sizes/:sizeId       size fields, OR full-replace plans[]
 *   DELETE …/offers/:offerType/sizes/:sizeId       guarded
 *   PATCH  …/sizes/:sizeId/plans/:tenor            one plan's money
 *   DELETE …/sizes/:sizeId/plans/:tenor            guarded
 *
 * Two absences shape the UI (tickets 18 and 19): there is no way to **add an
 * offer** to an existing asset, and no way to **add a plan** except by
 * full-replacing a size's plans[].
 *
 * Every mutation invalidates the detail query rather than patching the cache —
 * the tree is small, and the backend applies guards we would otherwise have to
 * re-derive locally.
 * ============================================================ */

/**
 * None of these mutations read their response — every one invalidates the
 * detail query and re-reads. So there is nothing to validate, and validating
 * anyway only adds a way to fail.
 *
 * That is not hypothetical: the create hook parsed a full entity schema it
 * didn't need and rejected every successful create, because the write response
 * and the list projection are different shapes. Strictness belongs on the read
 * that renders the data — `useAssetDetail` — not on a write we only use as a
 * signal that it worked.
 */
const WriteResultSchema = z.unknown();

function useTreeMutation<TVariables, TData>(
  assetId: string,
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      // Offer/size/plan counts show on the list row's offers cell.
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

/* -------------------- offer -------------------- */

export type UpdateOfferPayload = {
  is_active?: boolean;
  allocation_qualification_pct?: number;
  payment_type?: 'all-inclusive' | 'partially-inclusive';
};

/**
 * The only offer-level write. Note there is no create and no delete —
 * switching `is_active` off is how an offer is taken out of use (ticket 18).
 */
export const useUpdateOffer = (assetId: string, offerType: OfferType) =>
  useTreeMutation(assetId, (payload: UpdateOfferPayload) =>
    apiPatch(`/admin/assets/${assetId}/offers/${offerType}`, payload, WriteResultSchema)
  );

/* -------------------- size -------------------- */

export type AddSizePayload = {
  size_sqm: number;
  units_available: number;
  document_fee?: number;
  plans: Plan[];
};

/** A size is created together with its plans — `AddSizeDto` extends `SizeInputDto`. */
export const useAddSize = (assetId: string, offerType: OfferType) =>
  useTreeMutation(assetId, (payload: AddSizePayload) =>
    apiPost(`/admin/assets/${assetId}/offers/${offerType}/sizes`, payload, WriteResultSchema)
  );

export type UpdateSizePayload = {
  size_sqm?: number;
  units_available?: number;
  document_fee?: number;
  is_active?: boolean;
  /**
   * A **full replacement** of the size's plans, not a merge.
   *
   * This is the only route for adding a plan or changing a tenor, so it is
   * also a read-modify-write: send the complete list, including plans you
   * didn't touch, or they are dropped. Two admins editing different plans on
   * the same size will lose one of the edits — ticket 19.
   */
  plans?: Plan[];
};

export const useUpdateSize = (assetId: string, offerType: OfferType) =>
  useTreeMutation(
    assetId,
    ({ sizeId, ...payload }: UpdateSizePayload & { sizeId: string }) =>
      apiPatch(
        `/admin/assets/${assetId}/offers/${offerType}/sizes/${sizeId}`,
        payload,
        WriteResultSchema
      )
  );

/** Refused with `SIZE_HAS_ACTIVE_PLANS` when customers are on this size. */
export const useDeleteSize = (assetId: string, offerType: OfferType) =>
  useTreeMutation(assetId, (sizeId: string) =>
    apiDelete(`/admin/assets/${assetId}/offers/${offerType}/sizes/${sizeId}`, WriteResultSchema)
  );

/* -------------------- plan -------------------- */

/** Everything except the tenor, which is the plan's identity. */
export type UpdatePlanPayload = {
  land_price?: number;
  initial_payment?: number;
  monthly_installment?: number;
  is_promo?: boolean;
  is_active?: boolean;
};

export const useUpdatePlan = (assetId: string, offerType: OfferType) =>
  useTreeMutation(
    assetId,
    ({ sizeId, tenor, ...payload }: UpdatePlanPayload & { sizeId: string; tenor: number }) =>
      apiPatch(
        `/admin/assets/${assetId}/offers/${offerType}/sizes/${sizeId}/plans/${tenor}`,
        payload,
        WriteResultSchema
      )
  );

/**
 * Refused with `LAST_PLAN` when it is the size's only plan, and with
 * `SIZE_HAS_ACTIVE_PLANS` when customers are on the size — note that guard
 * counts across the **whole size**, not the individual tenor.
 */
export const useDeletePlan = (assetId: string, offerType: OfferType) =>
  useTreeMutation(assetId, ({ sizeId, tenor }: { sizeId: string; tenor: number }) =>
    apiDelete(
      `/admin/assets/${assetId}/offers/${offerType}/sizes/${sizeId}/plans/${tenor}`,
      WriteResultSchema
    )
  );
