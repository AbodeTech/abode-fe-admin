import { z } from 'zod';

import { TopographySchema, VisibilitySchema } from './asset.schema';
import { productPoolFormSchema, totalAssignedSqm } from './land-configuration.schema';

/* ============================================================
 * Create asset — form schema and payload mapper.
 *
 * Creation now starts the physical-land account (total estate sqm + initial
 * per-product assigned sqm) instead of asking for a unit-count sales cap, and
 * no longer requires offers/sizes/plans — those are completed after creation
 * on the Offers tab, which still enforces the backend's structural rules for
 * that tree (see `planFormSchema` below, used there via
 * `OfferEditDialogs.tsx`).
 *
 * Zero product pools is allowed at creation — an estate-only draft before
 * products are known — confirmed against the real abode-be-v2
 * `CreateAssetDto`, which makes `product_pools` optional. That DTO also makes
 * `total_land_sqm` itself optional (for a pure-legacy-only asset with no land
 * account at all), which this schema does NOT currently allow — it requires a
 * positive `total_land_sqm` unconditionally. That's a real gap against what
 * the backend supports, not a deliberate choice; revisit if legacy-only
 * creation turns out to still be needed.
 *
 * `planFormSchema` still re-implements two of the backend's six structural
 * plan-arithmetic rules, because a rejection from the server arrives as a
 * wall of class-validator text an admin cannot act on:
 *   1. tenor 0 (outright)  → monthly must be 0, initial must equal land_price
 *   2. tenor ≥ 1           → |initial + monthly × (tenor−1) − land_price| ≤ max(1, tenor)
 *
 * The other four (tenor uniqueness, flex-may-not-use-outright, FO-model
 * document_fee, FO-model payment_type) are offer/size-level rules that moved
 * to the Offers tab's own add-offer/add-size flow along with the tree itself.
 *
 * Money is whole naira. The backend's `@IsInt()` forbids decimals, and its
 * tolerance (rule 2) exists precisely to absorb the rounding that causes —
 * worst-case error is 0.5 × (tenor−1), and the tolerance is tenor, so whole
 * naira always fits.
 * ============================================================ */

const naira = z
  .number({ message: 'Enter an amount' })
  .int('Whole naira only — the backend rejects kobo')
  .min(0, 'Cannot be negative');

const optionalUrl = z.union([z.url('Must be a valid URL'), z.literal('')]).optional();

/** `expected` for a plan, per the backend's arithmetic. */
export function expectedLandPrice(plan: {
  tenor_months: number;
  initial_payment: number;
  monthly_installment: number;
}): number {
  if (plan.tenor_months <= 0) return plan.initial_payment;
  return plan.initial_payment + plan.monthly_installment * (plan.tenor_months - 1);
}

/**
 * The backend's real tolerance — confirmed against `isPlanMathConsistent()`
 * (`dto/asset-plan.validators.ts`, `@ValidatePlanConsistency()`, gating
 * `CreateAssetDto`/`OfferInputDto`/`SizeInputDto`/`UpdateSizeDto`) and
 * `assertPlanMath()` (`plan-validation.ts`, gating `addPlan`/`updatePlan`):
 * `max(0.01, tenor_months * 0.01)`, not `max(1, tenor_months)`. Since every
 * amount is whole naira (`@IsInt()`), that's effectively zero tolerance for
 * any tenor under 100 months — the old, far looser client-side check let an
 * admin submit numbers this form accepted as valid, only for the real
 * backend to 400 with `PLAN_MATH_INVALID` right after.
 */
export function planTolerance(tenorMonths: number): number {
  return Math.max(0.01, tenorMonths * 0.01);
}

/**
 * Solves for a monthly instalment (and, if whole-naira rounding leaves a
 * remainder, a slightly adjusted initial payment) so
 * `initial + monthly × (tenor − 1)` lands EXACTLY on `land_price` — not just
 * within `planTolerance`. Rounding the monthly instalment alone is not
 * enough on its own: `land_price − initial_payment` rarely divides evenly by
 * `tenor − 1`, and the real tolerance above is too tight for that leftover
 * remainder to survive. Folding it back into the initial payment (rather
 * than leaving it as an invalid drift) is the same trade-off a human doing
 * this by hand would make — front-load the odd naira into the deposit
 * instead of an uneven final instalment.
 *
 * `initial_payment` in the result only ever differs from the input when
 * whole-naira rounding required it — callers should tell the admin when
 * that happens rather than silently overwrite what they typed.
 */
export function calculateExactInstalment(
  landPrice: number,
  initialPayment: number,
  tenorMonths: number
): { initial_payment: number; monthly_installment: number } {
  if (tenorMonths <= 1) {
    // Outright (0) or a single payment (1) — the whole price is the "initial payment", no instalment at all.
    return { initial_payment: landPrice, monthly_installment: 0 };
  }
  const remaining = landPrice - initialPayment;
  const monthly = Math.round(remaining / (tenorMonths - 1));
  const adjustedInitial = landPrice - monthly * (tenorMonths - 1);
  return { initial_payment: adjustedInitial, monthly_installment: monthly };
}

export const planFormSchema = z
  .object({
    tenor_months: z
      .number({ message: 'Enter a tenor' })
      .int('Whole months only')
      .min(0, 'Cannot be negative'),
    land_price: naira,
    initial_payment: naira,
    monthly_installment: naira,
    is_promo: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  // Rule 1 — outright.
  .refine(
    (plan) => plan.tenor_months !== 0 || plan.monthly_installment === 0,
    { message: 'An outright plan has no monthly instalment', path: ['monthly_installment'] }
  )
  .refine(
    (plan) => plan.tenor_months !== 0 || plan.initial_payment === plan.land_price,
    {
      message: 'An outright plan is paid in full — this must equal the land price',
      path: ['initial_payment'],
    }
  )
  // Rule 2 — instalment arithmetic.
  .refine(
    (plan) =>
      plan.tenor_months < 1 ||
      Math.abs(expectedLandPrice(plan) - plan.land_price) <= planTolerance(plan.tenor_months),
    {
      message: 'Instalments don’t add up to the land price',
      path: ['land_price'],
    }
  );

export type PlanFormValues = z.infer<typeof planFormSchema>;

export const createAssetFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the asset a name'),
  asset_location: z.string().trim().optional(),
  google_map: optionalUrl,
  description: z.string().trim().optional(),
  topography: TopographySchema.optional(),
  asset_purpose: z.string().trim().optional(),

  /** Entered as free text, split on commas when submitted. */
  // Arrays in the form as well as on the wire — `CreateAssetDto` types both as
  // `string[]`, and a comma-joined text field can't represent a value that
  // contains a comma. Entered via TagInput.
  amenities: z.array(z.string().trim().min(1)),
  landmark: z.array(z.string().trim().min(1)),

  hero_image: optionalUrl,
  pictures: z.array(z.url()).default([]),
  documents: z
    .object({
      deed_of_assignment: optionalUrl,
      survey: optionalUrl,
      contract_of_sales: optionalUrl,
      estate_layout: optionalUrl,
    })
    .default({}),

  visibility: VisibilitySchema.default('draft'),

  total_land_sqm: z
    .number({ message: 'Enter the total estate size' })
    .int('Whole square metres only')
    .positive('Must be greater than zero'),
  product_pools: z.array(productPoolFormSchema).default([]),
})
  .refine(
    (values) =>
      new Set(values.product_pools.map((pool) => pool.offer_type)).size ===
      values.product_pools.length,
    { message: 'Each product can only be assigned once', path: ['product_pools'] }
  )
  .refine(
    (values) => totalAssignedSqm(values.product_pools) <= values.total_land_sqm,
    { message: 'Assigned sqm exceeds the total estate size', path: ['product_pools'] }
  );

export type CreateAssetFormValues = z.input<typeof createAssetFormSchema>;
export type CreateAssetFormOutput = z.output<typeof createAssetFormSchema>;

/* -------------------- payload -------------------- */

/**
 * Exactly what `CreateAssetDto` declares. The backend runs
 * `forbidNonWhitelisted`, so an extra key is a hard 400 — blank optionals are
 * omitted rather than sent as empty strings.
 */
/** Drop the key entirely when the list is empty, rather than sending `[]`. */
const listOrUndefined = (items: string[] | undefined): string[] | undefined =>
  items && items.length > 0 ? items : undefined;

const omitBlank = <T extends Record<string, unknown>>(source: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>;

export function createAssetFormToPayload(values: CreateAssetFormOutput) {
  return omitBlank({
    name: values.name,
    asset_location: values.asset_location,
    google_map: values.google_map,
    description: values.description,
    topography: values.topography,
    asset_purpose: values.asset_purpose,
    amenities: listOrUndefined(values.amenities),
    landmark: listOrUndefined(values.landmark),
    hero_image: values.hero_image,
    pictures: values.pictures.length > 0 ? values.pictures : undefined,
    documents: Object.keys(omitBlank(values.documents)).length
      ? omitBlank(values.documents)
      : undefined,
    visibility: values.visibility,
    total_land_sqm: values.total_land_sqm,
    product_pools: values.product_pools.map((pool) => ({
      offer_type: pool.offer_type,
      assigned_sqm: pool.assigned_sqm,
    })),
  });
}
