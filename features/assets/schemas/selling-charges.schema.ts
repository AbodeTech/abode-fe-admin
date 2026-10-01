import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * Selling charges — GET/PUT /admin/assets/:assetId/selling-charges(/history).
 * An asset-wide, versioned list of buyer-facing charges. Gated
 * `view_asset_costs`/`manage_asset_costs`.
 *
 * Transcribed from `SellingChargeService`/`SetSellingChargesDto` on
 * abode-be-v2 staging as of commit 0f042ef (28 Sep 2026). That commit changed
 * the contract this file was first written against:
 *   - GET returns `{as_of, in_force, scheduled, latest_version}` rather than
 *     one bare version — a version can now be approved for a future date, so
 *     "what buyers pay today" and "what was saved last" are different things;
 *   - a version row carries `is_latest` (it used to be `is_current`);
 *   - PUT requires `expected_version` and refuses a stale save with 409
 *     `SELLING_CHARGE_VERSION_CONFLICT`.
 * ============================================================ */

export const SELLING_CHARGE_TYPES = [
  'land_price',
  'development_levy',
  'documentation_levy',
  'survey_fee',
  'other',
] as const;
export const SellingChargeTypeSchema = z.enum(SELLING_CHARGE_TYPES);
export type SellingChargeType = z.infer<typeof SellingChargeTypeSchema>;

export const SELLING_CHARGE_TYPE_LABELS: Record<SellingChargeType, string> = {
  land_price: 'Land price',
  development_levy: 'Development levy',
  documentation_levy: 'Documentation levy',
  survey_fee: 'Survey fee',
  other: 'Other',
};

export const CHARGE_BASES = ['per_sqm', 'per_unit', 'flat'] as const;
export const ChargeBasisSchema = z.enum(CHARGE_BASES);
export type ChargeBasis = z.infer<typeof ChargeBasisSchema>;

export const CHARGE_BASIS_LABELS: Record<ChargeBasis, string> = {
  per_sqm: 'Per sqm',
  per_unit: 'Per unit',
  flat: 'Flat',
};

export const SellingChargeLineSchema = z.object({
  charge_type: SellingChargeTypeSchema,
  label: z.string(),
  offer_type: OfferTypeSchema.nullable().optional(),
  size_id: z.string().nullable().optional(),
  amount: z.number(),
  basis: ChargeBasisSchema.default('per_unit'),
  note: z.string().nullable().optional(),
});

export type SellingChargeLine = z.infer<typeof SellingChargeLineSchema>;

/** One approved version — the shape of `in_force`, each `scheduled` row and each history row. */
export const SellingChargeVersionSchema = z.object({
  version: z.number(),
  charges: z.array(SellingChargeLineSchema),
  effective_date: z.string(),
  /** The most recently SAVED version — which is not the one in force when a later one is still scheduled. */
  is_latest: z.boolean(),
  reason: z.string(),
  approved_by: z.string(),
  approved_at: z.string().nullable(),
});

export type SellingChargeVersion = z.infer<typeof SellingChargeVersionSchema>;

/**
 * GET /admin/assets/:assetId/selling-charges.
 *
 *  - `in_force`        the version buyers are charged under right now: the
 *                      newest one whose `effective_date` has arrived. `null`
 *                      until one has.
 *  - `scheduled`       versions approved for a future date, soonest first.
 *  - `latest_version`  the highest version number saved (0 when none). This
 *                      is what the next save must send as `expected_version`.
 */
export const SellingChargesSchema = z.object({
  as_of: z.string(),
  in_force: SellingChargeVersionSchema.nullable(),
  scheduled: z.array(SellingChargeVersionSchema).default([]),
  latest_version: z.number(),
});

export type SellingCharges = z.infer<typeof SellingChargesSchema>;

/** GET .../selling-charges/history — every version ever approved, oldest first. */
export const SellingChargesHistoryEntrySchema = SellingChargeVersionSchema;

export type SellingChargesHistoryEntry = z.infer<typeof SellingChargesHistoryEntrySchema>;

/**
 * The newest version saved — the last scheduled one if any, otherwise the one
 * in force. This is what the editor starts from, so an edit builds on the
 * latest approved list rather than on one a scheduled version is about to
 * replace.
 */
export function latestSellingChargeVersion(charges: SellingCharges | null | undefined): SellingChargeVersion | null {
  if (!charges) return null;
  const all = [...charges.scheduled, ...(charges.in_force ? [charges.in_force] : [])];
  return all.reduce<SellingChargeVersion | null>(
    (latest, version) => (!latest || version.version > latest.version ? version : latest),
    null
  );
}

/**
 * PUT's response — just the new version, plus `starts_in_future` when its
 * effective date hasn't arrived (it was scheduled, not put in force).
 */
export const SetSellingChargesResultSchema = z.object({
  version: z.number(),
  charges: z.array(SellingChargeLineSchema),
  effective_date: z.string(),
  starts_in_future: z.boolean().default(false),
});

export type SetSellingChargesResult = z.infer<typeof SetSellingChargesResultSchema>;

/* -------------------- editor form -------------------- */

export const sellingChargeLineFormSchema = z.object({
  charge_type: SellingChargeTypeSchema.default('other'),
  label: z.string().trim().min(1, 'Give this charge a name').max(120),
  offer_type: OfferTypeSchema.optional(),
  size_id: z.string().optional(),
  amount: z.number({ message: 'Enter an amount' }).min(0, 'Cannot be negative'),
  basis: ChargeBasisSchema.default('per_unit'),
  note: z.string().trim().max(300).optional(),
});

export type SellingChargeLineFormValues = z.infer<typeof sellingChargeLineFormSchema>;

/**
 * PUT /admin/assets/:assetId/selling-charges — a complete replacement,
 * approved as a new version from `effective_date` (a future date schedules
 * it). `expected_version` is the `latest_version` the editor loaded: if
 * someone else has saved since, the backend answers 409 instead of
 * overwriting them.
 */
export const setSellingChargesFormSchema = z.object({
  expected_version: z.number(),
  charges: z.array(sellingChargeLineFormSchema).min(1, 'Add at least one charge'),
  effective_date: z.string().min(1, 'Choose an effective date'),
  reason: z.string().trim().min(1, 'Say why this is changing').max(500),
});

export type SetSellingChargesFormValues = z.input<typeof setSellingChargesFormSchema>;
export type SetSellingChargesFormOutput = z.output<typeof setSellingChargesFormSchema>;
