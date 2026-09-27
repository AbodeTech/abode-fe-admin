import { z } from 'zod';

import {
  AssetDocumentsSchema,
  AssetHistoryEntrySchema,
  InventoryModelVersionSchema,
  LandInventoryStateSchema,
  OfferTypeSchema,
  PaymentTypeSchema,
  TopographySchema,
  VisibilitySchema,
} from './asset.schema';

/* ============================================================
 * GET /admin/assets/:id — the full tree.
 *
 *   { ...asset, offers: [ { ...offer, sizes: [ { ...size, plans[] } ] } ] }
 *
 * Note what has an `_id` and what doesn't:
 *
 *   Asset   ✓        addressed by :id
 *   Offer   ✓  …but addressed by :offerType in every endpoint
 *   Size    ✓        addressed by :sizeId
 *   Plan    ✗        `@Schema({ _id: false })` — a subdocument
 *
 * Plans have no identity of their own, which is why the API addresses them by
 * `:tenor` and why `UpdatePlanDto` omits `tenor_months`. Changing a tenor is
 * therefore not an edit — it is a delete and a re-create. See ticket 19.
 * ============================================================ */

export const PlanSchema = z.object({
  tenor_months: z.number(),
  land_price: z.number(),
  initial_payment: z.number(),
  monthly_installment: z.number(),
  /** Full-ownership model only — full-ownership and commercial. */
  is_promo: z.boolean().optional(),
  is_active: z.boolean().default(true),
  /**
   * 🚧 Provisional additions, layered onto the real abode-be-v2 Plan contract
   * above (tickets 18/19) — this real backend doesn't have these fields yet.
   * Additional, separately-tracked amounts that never enter the real
   * backend's validated plan arithmetic (`planFormSchema`'s outright/
   * tenor-consistency rules) — only `totalSellingPrice()` below sums all
   * three, purely for display.
   */
  development_levy: z.number().default(0),
  document_levy: z.number().default(0),
});

export type Plan = z.infer<typeof PlanSchema>;

/** Never stored — always land_price + the two levies, so it can never disagree with its parts. */
export function totalSellingPrice(plan: Pick<Plan, 'land_price' | 'development_levy' | 'document_levy'>): number {
  return plan.land_price + plan.development_levy + plan.document_levy;
}

const SizeShapeSchema = z.object({
  _id: z.string(),
  offer_id: z.string().optional(),
  size_sqm: z.number(),
  /**
   * The real wire field — confirmed against `SizeDto`/`SizeInputDto`/
   * `UpdateSizeDto` on abode-be-v2 staging (both read and write). This
   * backend has never used `configured_units` for this endpoint; that name
   * only exists as an internal, server-computed Mongoose field mirrored from
   * `units_available` on create, never exposed here.
   */
  units_available: z.number().optional(),
  /**
   * A real, persisted Mongoose field — but only ever mirrored from
   * `units_available` at CREATE time (`sizeFields()` in `asset.service.ts`).
   * `updateSize()` sets `units_available` alone and never touches this field
   * at all, so after any edit it's stale — confirmed live: setting
   * `units_available: 2` on an existing size left this still reading its
   * old value, showing "0 configured units" in the UI despite the save
   * genuinely succeeding. `units_available` is the one field both create AND
   * update actually keep current, so the transform below must prefer it,
   * never fall back to this one first.
   */
  configured_units: z.number().optional(),
  /** Required on full-ownership and commercial sizes; absent on flex. */
  document_fee: z.number().optional(),
  is_active: z.boolean().default(true),
  plans: z.array(PlanSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * `size.configured_units` is this app's one internal name for "the planned
 * catalogue quantity" (`size_sqm × configured_units` is this size's slice of
 * its product's `assigned_sqm` pool — purchases never decrement it in Phase
 * 1, so it is planning data, not live stock) — used throughout Offers, Land
 * Configuration, and sqm-inventory capacity math. This transform is the one
 * place that reconciles it against whichever field the real response
 * actually sent, so every other reader in this app can keep using
 * `configured_units` unconditionally.
 */
export const SizeSchema = SizeShapeSchema.transform((size) => ({
  ...size,
  // `units_available` first — it's the only one of the two the backend keeps
  // current after an edit; `configured_units` is a stale, create-time-only
  // mirror the moment a size is ever updated. See `configured_units`'s own
  // doc comment above for the confirmed live bug this caused.
  configured_units: size.units_available ?? size.configured_units ?? 0,
}));

export type Size = z.infer<typeof SizeSchema>;

/** This size's slice of its product's assigned_sqm pool. */
export function configuredSqm(size: Pick<Size, 'size_sqm' | 'configured_units'>): number {
  return size.size_sqm * size.configured_units;
}

export const OfferSchema = z.object({
  _id: z.string(),
  asset_id: z.string().optional(),
  offer_type: OfferTypeSchema,
  is_active: z.boolean().default(true),
  allocation_qualification_pct: z.number(),
  /** Full-ownership model only — full-ownership and commercial. */
  payment_type: PaymentTypeSchema.optional(),
  /** The product's commercial land pool (see land-configuration.schema.ts). Not decremented by purchases in Phase 1. */
  assigned_sqm: z.number().default(0),
  sizes: z.array(SizeSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Offer = z.infer<typeof OfferSchema>;

/** Sum of every active size's slice of this offer's assigned_sqm pool. */
export function offerConfiguredSqm(offer: Pick<Offer, 'sizes'>): number {
  return offer.sizes
    .filter((size) => size.is_active)
    .reduce((sum, size) => sum + configuredSqm(size), 0);
}

/**
 * Mirrors the backend's `PitchPack` subdocument — a single PDF per asset,
 * with its own endpoint family (`PUT`/`DELETE /admin/assets/:id/pitch-pack`)
 * rather than living in `documents`. `null` means no pitch pack uploaded.
 */
export const PitchPackSchema = z.object({
  url: z.string(),
  size_bytes: z.number(),
  uploaded_at: z.string(),
});

export type PitchPack = z.infer<typeof PitchPackSchema>;

/**
 * Same asset fields as the list row, but `offers` is the full nested tree
 * rather than a counts summary — so this is its own schema rather than an
 * extension of `AssetSchema`.
 */
export const AssetDetailSchema = z.object({
  _id: z.string(),
  name: z.string(),
  asset_location: z.string().nullable().optional(),
  google_map: z.string().nullable().optional(),
  description: z.string().nullable().optional(),

  amenities: z.array(z.string()).default([]),
  landmark: z.array(z.string()).default([]),
  topography: TopographySchema.nullable().optional(),
  asset_purpose: z.string().nullable().optional(),

  hero_image: z.string().nullable().optional(),
  pictures: z.array(z.string()).default([]),
  documents: AssetDocumentsSchema.default({}),
  pitch_pack: PitchPackSchema.nullable().optional(),
  asset_history: z.array(AssetHistoryEntrySchema).default([]),

  sales_cap: z.number(),
  sold_units: z.number().default(0),
  reserved_units: z.number().default(0),
  available_units: z.number().nullable().optional(),

  /** See the matching fields on AssetSchema — never combined with the legacy unit fields above. */
  total_land_sqm: z.number().nullable().default(null),
  land_inventory_state: LandInventoryStateSchema.default('not_configured'),
  inventory_model_version: InventoryModelVersionSchema.default('legacy_units'),
  land_configuration_version: z.number().default(0),

  sold: z.boolean().default(false),
  visibility: VisibilitySchema,
  deleted_at: z.string().nullable().optional(),

  offers: z.array(OfferSchema).default([]),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AssetDetail = z.infer<typeof AssetDetailSchema>;

/** Plans in a stable order — outright first, then ascending tenor. */
export function sortedPlans(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => a.tenor_months - b.tenor_months);
}

/**
 * The backend blocks deleting a size that has customers on it, and blocks
 * deleting a size's last plan. Both are surfaced as disabled controls with the
 * reason rather than attempted and rejected — but the active-plan count is not
 * in this payload, so only the last-plan rule can be enforced client-side.
 */
export function isLastPlan(size: Pick<Size, 'plans'>): boolean {
  return size.plans.length <= 1;
}
