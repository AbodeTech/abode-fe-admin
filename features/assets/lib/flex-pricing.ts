/* ============================================================
 * Flex 2.0 pricing engine — a pure function of the editor's three inputs.
 *
 * One 36-month base plan per size, plus admin-set discounts at exactly two
 * checkpoints: 24 and 12 months (D01). Any whole month from 12 to 36 is a
 * straight-line interpolation between the two nearest of (36, 0%), (24, d24)
 * and (12, d12), separately for each segment. First and monthly payment are
 * *calculated*, never entered (D02). Rounding (D03): regular payments round
 * down to the kobo, the final payment clears the exact residual.
 *
 * Money is decimal naira on the wire; every step here runs on integer kobo so
 * nothing drifts, and the one place a fraction appears — the discounted total
 * — is rounded half-up with BigInt (base × factor overflows 2^53 on large
 * estates). The preview is instant in the browser; POST …/pricing/preview on
 * the backend is the authority and must agree with this to the kobo (the
 * reference vectors in the endpoint contract are asserted in
 * scripts/flex-pricing-mock-qa.ts).
 * ============================================================ */

export const BASE_TENOR_MONTHS = 36;
export const MIN_TENOR_MONTHS = 12;
export const CHECKPOINT_MONTHS = [24, 12] as const;

export type PricingInput = {
  /** Naira, at most 2 dp. */
  base_price_per_unit: number;
  /** Percent, at most 2 dp. */
  discount_24_pct: number;
  discount_12_pct: number;
};

export type PreviewRow = {
  months: number;
  is_base: boolean;
  is_checkpoint: boolean;
  /** Percent, 4 dp. */
  discount_pct: number;
  /** Naira. */
  total: number;
  regular_payment: number;
  final_payment: number;
  largest_payment: number;
};

export type PricingError = {
  field: 'base_price_per_unit' | 'discount_24_pct' | 'discount_12_pct';
  code: 'BASE_PRICE_INVALID' | 'DISCOUNT_OUT_OF_RANGE' | 'DISCOUNT_ORDER_INVALID';
  message: string;
};

const toKobo = (naira: number): bigint => BigInt(Math.round(naira * 100));
const fromKobo = (kobo: bigint): number => Number(kobo) / 100;

const hasAtMostTwoDecimals = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

/** Trims float noise from a percent shown to the admin: 5.5 not 5.499999. */
const pct = (value: number): string => String(Math.round(value * 100) / 100);

export function validatePricing(input: Partial<PricingInput>): PricingError[] {
  const errors: PricingError[] = [];
  const { base_price_per_unit: price, discount_24_pct: d24, discount_12_pct: d12 } = input;

  if (price === undefined || Number.isNaN(price) || price <= 0) {
    errors.push({ field: 'base_price_per_unit', code: 'BASE_PRICE_INVALID', message: 'Base price must be greater than ₦0.' });
  } else if (!hasAtMostTwoDecimals(price)) {
    errors.push({ field: 'base_price_per_unit', code: 'BASE_PRICE_INVALID', message: 'Base price can have at most 2 decimal places.' });
  }

  const checkpoints: [PricingError['field'], number | undefined, number][] = [
    ['discount_24_pct', d24, 24],
    ['discount_12_pct', d12, 12],
  ];
  let rangeOk = true;
  for (const [field, value, months] of checkpoints) {
    if (value === undefined || Number.isNaN(value)) {
      errors.push({ field, code: 'DISCOUNT_OUT_OF_RANGE', message: `Enter the ${months}-month discount.` });
      rangeOk = false;
    } else if (value < 0 || value >= 100 || !hasAtMostTwoDecimals(value)) {
      errors.push({
        field,
        code: 'DISCOUNT_OUT_OF_RANGE',
        message: 'Discounts must be at least 0% and below 100%, with at most 2 decimal places.',
      });
      rangeOk = false;
    }
  }

  if (rangeOk && d24 !== undefined && d12 !== undefined && d24 > d12) {
    errors.push({
      field: 'discount_24_pct',
      code: 'DISCOUNT_ORDER_INVALID',
      message: `The 24-month discount (${pct(d24)}%) is larger than the 12-month discount (${pct(d12)}%). A shorter plan must never cost more.`,
    });
  }

  return errors;
}

/**
 * Whole months from 36 down to 12. Callers validate first; on invalid input
 * this returns an empty array rather than guessing numbers.
 */
export function previewRows(input: PricingInput): PreviewRow[] {
  if (validatePricing(input).length > 0) return [];

  const base = toKobo(input.base_price_per_unit);
  const d24 = BigInt(Math.round(input.discount_24_pct * 100)); // hundredths of a percent
  const d12 = BigInt(Math.round(input.discount_12_pct * 100));
  const DEN = BigInt(120000); // 12 months × 10,000 (hundredths of a percent → fraction)

  const rows: PreviewRow[] = [];
  for (let n = BASE_TENOR_MONTHS; n >= MIN_TENOR_MONTHS; n--) {
    const m = BigInt(n);
    // Discount × 120,000, so everything stays integer.
    const discountScaled = n >= 24 ? d24 * (BigInt(36) - m) : BigInt(12) * d24 + (d12 - d24) * (BigInt(24) - m);
    const factor = DEN - discountScaled;
    const total = (BigInt(2) * base * factor + DEN) / (BigInt(2) * DEN); // half-up, all values non-negative
    const regular = total / m; // floor, in kobo
    const final = total - regular * (m - BigInt(1));

    rows.push({
      months: n,
      is_base: n === BASE_TENOR_MONTHS,
      is_checkpoint: n === 24 || n === 12,
      discount_pct: Math.round((Number(discountScaled) * 25) / 3) / 10000, // scaled/1200 = percent, kept to 4 dp
      total: fromKobo(total),
      regular_payment: fromKobo(regular),
      final_payment: fromKobo(final),
      largest_payment: fromKobo(regular > final ? regular : final),
    });
  }
  return rows;
}

/** The 36-month row — the standard plan customers see first. */
export function basePlanPayments(input: PricingInput): { first_payment: number; monthly_payment: number; final_payment: number } | null {
  const row = previewRows(input).find((candidate) => candidate.is_base);
  if (!row) return null;
  return { first_payment: row.regular_payment, monthly_payment: row.regular_payment, final_payment: row.final_payment };
}
