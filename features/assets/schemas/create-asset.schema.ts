import { z } from 'zod';

import {
  OfferTypeSchema,
  PaymentTypeSchema,
  TopographySchema,
  VisibilitySchema,
  usesFoModel,
} from './asset.schema';

/* ============================================================
 * Create asset — form schema and payload mapper.
 *
 * The backend enforces six structural rules beyond field types. They are all
 * re-implemented here, because a rejection from the server arrives as a wall
 * of class-validator text an admin cannot act on, and by then they have filled
 * in a four-level form.
 *
 * Rules, all mirrored below:
 *   1. tenor 0 (outright)  → monthly must be 0, initial must equal land_price
 *   2. tenor ≥ 1           → |initial + monthly × (tenor−1) − land_price| ≤ max(1, tenor)
 *   3. tenors unique within a size
 *   4. flex sizes may NOT contain a tenor-0 plan — outright is FO-model only
 *   5. FO-model sizes MUST supply document_fee (0 is fine, absent is not)
 *   6. payment_type is required on FO-model offers
 *
 * "FO-model" = full-ownership or commercial — the backend's `usesFoModel()`
 * treats both the same; only flex is exempt from rules 4–6.
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

/** The backend's tolerance: `max(1, tenor_months)`. */
export function planTolerance(tenorMonths: number): number {
  return Math.max(1, tenorMonths);
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

export const sizeFormSchema = z.object({
  size_sqm: z
    .number({ message: 'Enter a size' })
    .int('Whole square metres only')
    .positive('Must be greater than zero'),
  units_available: z
    .number({ message: 'Enter a unit count' })
    .int('Whole units only')
    .min(0, 'Cannot be negative'),
  /** Rule 5 — required for full-ownership, enforced at the offer level below. */
  document_fee: naira.optional(),
  plans: z.array(planFormSchema).min(1, 'Add at least one plan'),
});

export type SizeFormValues = z.infer<typeof sizeFormSchema>;

export const offerFormSchema = z
  .object({
    offer_type: OfferTypeSchema,
    is_active: z.boolean().optional(),
    allocation_qualification_pct: z
      .number({ message: 'Enter a percentage' })
      .int('Whole percentages only')
      .min(1, 'Must be at least 1%')
      .max(100, 'Cannot exceed 100%'),
    payment_type: PaymentTypeSchema.optional(),
    sizes: z.array(sizeFormSchema).min(1, 'Add at least one size'),
  })
  // Rule 6 — payment type is required on FO-model offers.
  .refine(
    (offer) => !usesFoModel(offer.offer_type) || offer.payment_type !== undefined,
    { message: 'Choose a payment type', path: ['payment_type'] }
  )
  // Rule 5 — document fee required on every FO-model size.
  .refine(
    (offer) =>
      !usesFoModel(offer.offer_type) ||
      offer.sizes.every((size) => typeof size.document_fee === 'number'),
    { message: 'Every full-ownership or commercial size needs a document fee', path: ['sizes'] }
  )
  // Rule 4 — outright is full-ownership only.
  .refine(
    (offer) =>
      offer.offer_type !== 'flex' ||
      offer.sizes.every((size) => size.plans.every((plan) => plan.tenor_months >= 1)),
    {
      message: 'Flex plans run for at least one month — outright is full-ownership only',
      path: ['sizes'],
    }
  )
  // Rule 3 — tenors unique within each size.
  .refine(
    (offer) =>
      offer.sizes.every((size) => {
        const tenors = size.plans.map((plan) => plan.tenor_months);
        return new Set(tenors).size === tenors.length;
      }),
    { message: 'Each size can only have one plan per tenor', path: ['sizes'] }
  );

export type OfferFormValues = z.infer<typeof offerFormSchema>;

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

  sales_cap: z
    .number({ message: 'Enter a sales cap' })
    .int('Whole units only')
    .positive('Must be greater than zero'),
  visibility: VisibilitySchema.default('draft'),

  offers: z.array(offerFormSchema).min(1, 'An asset needs at least one offer'),
});

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
    sales_cap: values.sales_cap,
    visibility: values.visibility,
    offers: values.offers.map((offer) =>
      omitBlank({
        offer_type: offer.offer_type,
        is_active: offer.is_active ?? true,
        allocation_qualification_pct: offer.allocation_qualification_pct,
        // Only FO-model offers carry this; sending it on flex would 400.
        payment_type: usesFoModel(offer.offer_type) ? offer.payment_type : undefined,
        sizes: offer.sizes.map((size) =>
          omitBlank({
            size_sqm: size.size_sqm,
            units_available: size.units_available,
            document_fee: usesFoModel(offer.offer_type) ? (size.document_fee ?? 0) : undefined,
            plans: size.plans.map((plan) =>
              omitBlank({
                tenor_months: plan.tenor_months,
                land_price: plan.land_price,
                initial_payment: plan.initial_payment,
                monthly_installment: plan.monthly_installment,
                is_promo: plan.is_promo,
                is_active: plan.is_active ?? true,
              })
            ),
          })
        ),
      })
    ),
  });
}

/* -------------------- plan generation -------------------- */

/**
 * v1's pricing rule, carried across: shorter and longer tenors are derived
 * from a base plan by a per-year percentage adjustment.
 *
 *   yearDifference = (tenor − baseTenor) / 12
 *   price          = base × (1 + yearDifference × pct / 100)
 *
 * The instalment is then solved so the plan satisfies the backend's
 * arithmetic: `initial + monthly × (tenor − 1) = land_price`.
 */
export function derivePlan(
  base: { tenor_months: number; land_price: number; initial_payment: number },
  tenorMonths: number,
  adjustmentPctPerYear: number
): PlanFormValues {
  const yearDifference = (tenorMonths - base.tenor_months) / 12;
  const landPrice = Math.round(base.land_price * (1 + (yearDifference * adjustmentPctPerYear) / 100));

  // Tenor 0 and tenor 1 both mean a single payment: the backend's formula is
  // `initial + monthly × (tenor − 1)`, which at tenor 1 is just `initial`. So
  // a one-month plan must be paid in full, exactly like an outright one — a
  // proportional deposit here could never satisfy the arithmetic.
  if (tenorMonths <= 1) {
    return {
      tenor_months: tenorMonths,
      land_price: landPrice,
      initial_payment: landPrice,
      monthly_installment: 0,
    };
  }

  // Keep the deposit proportional to the base, then solve for the instalment
  // so the arithmetic holds rather than leaving the admin to reconcile it.
  const ratio = base.land_price > 0 ? base.initial_payment / base.land_price : 0;
  const initial = Math.round(landPrice * ratio);
  const monthly = Math.round((landPrice - initial) / (tenorMonths - 1));

  return {
    tenor_months: tenorMonths,
    land_price: landPrice,
    initial_payment: initial,
    monthly_installment: monthly,
  };
}
