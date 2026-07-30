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
 * Since 2026-07-28 an offer can be **added** (ticket 18 resolved) but still
 * not deleted — switching `is_active` off is how one is taken out of use.
 */
export const useUpdateOffer = (assetId: string, offerType: OfferType) =>
  useTreeMutation(assetId, (payload: UpdateOfferPayload) =>
    apiPatch(`/admin/assets/${assetId}/offers/${offerType}`, payload, WriteResultSchema)
  );

export type AddOfferPayload = {
  offer_type: OfferType;
  is_active?: boolean;
  allocation_qualification_pct: number;
  payment_type?: 'all-inclusive' | 'partially-inclusive';
  /** `OfferInputDto` requires at least one size, arriving with its plans. */
  sizes: AddSizePayload[];
};

/**
 * POST /admin/assets/:assetId/offers — transactional like create: one bad
 * plan rejects the whole offer. Refused with `OFFER_ALREADY_EXISTS` when the
 * asset already sells this type, which the UI prevents by only offering the
 * missing type.
 */
export const useAddOffer = (assetId: string) =>
  useTreeMutation(assetId, (payload: AddOfferPayload) =>
    apiPost(`/admin/assets/${assetId}/offers`, payload, WriteResultSchema)
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

export type AddPlanPayload = {
  tenor_months: number;
  land_price: number;
  initial_payment: number;
  monthly_installment: number;
  is_promo?: boolean;
  is_active?: boolean;
};

/**
 * POST …/sizes/:sizeId/plans — one plan, atomically (ticket 19's add half).
 *
 * Refused with `TENOR_ALREADY_EXISTS` on a duplicate tenor. This replaces
 * adding through `useUpdateSize`'s full-replace `plans[]`, which could
 * silently drop a plan another admin added in the meantime. Editing an
 * existing plan's tenor is still full-replace — the open half of ticket 19.
 */
export const useAddPlan = (assetId: string, offerType: OfferType) =>
  useTreeMutation(
    assetId,
    ({ sizeId, ...payload }: AddPlanPayload & { sizeId: string }) =>
      apiPost(
        `/admin/assets/${assetId}/offers/${offerType}/sizes/${sizeId}/plans`,
        payload,
        WriteResultSchema
      )
  );

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
