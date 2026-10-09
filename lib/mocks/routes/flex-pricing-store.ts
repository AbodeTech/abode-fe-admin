import { MockHttpError } from '../router';

/* ============================================================
 * Flex 2.0 pricing — the mock backend's state and arithmetic.
 *
 * Deliberately has no imports from assets.ts (which decorates its offer tree
 * with this state) and none from features/ (the mock is the stand-in for the
 * server, so it must not share the UI's engine — scripts/flex-pricing-mock-qa.ts
 * checks the two agree). The arithmetic here is written differently on
 * purpose: exact BigInt fractions per month, not the editor's scaled integers.
 *
 * Contract: docs/FLEX-2.0-ENDPOINTS.pdf, section 3.
 * ============================================================ */

export type MockCheckpoint = { months: number; discount_pct: number };

export type MockPricingVersion = {
  version: number;
  based_on_version: number | null;
  base_price_per_unit: number;
  checkpoints: MockCheckpoint[];
  published_by: { id: string; name: string };
  published_at: string;
  purchase_count: number;
  pending_transfer_count: number;
};

export type MockPricingDraft = {
  based_on_version: number | null;
  base_price_per_unit: number;
  checkpoints: MockCheckpoint[];
  saved_by: { id: string; name: string };
  saved_at: string;
};

export type MockPricingState = {
  mode: 'base_plan' | 'tenor_list' | 'unpriced';
  versions: MockPricingVersion[];
  draft: MockPricingDraft | null;
};

export const MOCK_PRICING_ADMIN = { id: 'u_1', name: 'Nicholas' };

const states: Record<string, MockPricingState> = {};

/* -------------------- arithmetic -------------------- */

const KOBO = BigInt(100);

function koboOf(naira: number): bigint {
  return BigInt(Math.round(naira * 100));
}

/** discount(n) as an exact fraction of a percent: [numerator, denominator]. */
function discountFraction(n: number, d24: number, d12: number): [bigint, bigint] {
  const D24 = BigInt(Math.round(d24 * 100));
  const D12 = BigInt(Math.round(d12 * 100));
  const N = BigInt(n);
  // percent × 100 (hundredths) over 12 months of interpolation
  if (n >= 24) return [D24 * (BigInt(36) - N), BigInt(12) * BigInt(100)];
  return [D24 * BigInt(12) + (D12 - D24) * (BigInt(24) - N), BigInt(12) * BigInt(100)];
}

export type MockRow = {
  months: number;
  is_base: boolean;
  is_checkpoint: boolean;
  discount_pct: number;
  total: number;
  regular_payment: number;
  final_payment: number;
  largest_payment: number;
};

export function previewRowsFor(basePrice: number, checkpoints: MockCheckpoint[]): MockRow[] {
  const d24 = checkpoints.find((c) => c.months === 24)!.discount_pct;
  const d12 = checkpoints.find((c) => c.months === 12)!.discount_pct;
  const base = koboOf(basePrice);

  const rows: MockRow[] = [];
  for (let n = 36; n >= 12; n--) {
    const [num, den] = discountFraction(n, d24, d12);
    // total = base × (1 − num/(den·100)) = base × (den·100 − num) / (den·100)
    const denom = den * BigInt(100);
    const numer = base * (denom - num);
    const total = (numer * BigInt(2) + denom) / (denom * BigInt(2)); // half-up to the kobo
    const regular = total / BigInt(n);
    const final = total - regular * BigInt(n - 1);
    rows.push({
      months: n,
      is_base: n === 36,
      is_checkpoint: n === 24 || n === 12,
      discount_pct: Math.round((Number(num) / Number(den)) * 10000) / 10000,
      total: Number(total) / Number(KOBO),
      regular_payment: Number(regular) / Number(KOBO),
      final_payment: Number(final) / Number(KOBO),
      largest_payment: Number(regular > final ? regular : final) / Number(KOBO),
    });
  }
  return rows;
}

export type MockPricingError = { field: string; code: string; message: string };

// Same exact check as the backend (flex-pricing.engine.ts): no float epsilon to wrongly reject large kobo prices.
const twoDp = (v: number) => Number.isSafeInteger(Math.round(v * 100)) && Math.round(v * 100) / 100 === v;

/** Publish-time rules (contract §3.2). Draft saves skip this and check shape only. */
export function validatePricingBody(raw: unknown): { errors: MockPricingError[]; basePrice?: number; checkpoints?: MockCheckpoint[] } {
  const errors: MockPricingError[] = [];
  const dto = (raw ?? {}) as { base_price_per_unit?: unknown; checkpoints?: unknown };
  const price = typeof dto.base_price_per_unit === 'number' ? dto.base_price_per_unit : NaN;

  if (!(price > 0) || !twoDp(price)) {
    errors.push({ field: 'base_price_per_unit', code: 'BASE_PRICE_INVALID', message: 'Base price must be greater than ₦0, with at most 2 decimal places.' });
  }

  const list = Array.isArray(dto.checkpoints) ? (dto.checkpoints as MockCheckpoint[]) : [];
  const months = list.map((c) => c?.months).sort((a, b) => b - a);
  const shapeOk = list.length === 2 && months[0] === 24 && months[1] === 12;
  if (!shapeOk) {
    errors.push({ field: 'checkpoints', code: 'CHECKPOINTS_INVALID', message: 'Exactly two checkpoints are required, at 24 and 12 months.' });
  }

  let rangeOk = shapeOk;
  if (shapeOk) {
    for (const c of list) {
      if (typeof c.discount_pct !== 'number' || c.discount_pct < 0 || c.discount_pct >= 100 || !twoDp(c.discount_pct)) {
        errors.push({ field: 'checkpoints[].discount_pct', code: 'DISCOUNT_OUT_OF_RANGE', message: 'Discounts must be at least 0% and below 100%, with at most 2 decimal places.' });
        rangeOk = false;
        break;
      }
    }
  }
  if (rangeOk) {
    const d24 = list.find((c) => c.months === 24)!.discount_pct;
    const d12 = list.find((c) => c.months === 12)!.discount_pct;
    if (d24 > d12) {
      errors.push({
        field: 'checkpoints[].discount_pct',
        code: 'DISCOUNT_ORDER_INVALID',
        message: `The 24-month discount (${d24}%) is larger than the 12-month discount (${d12}%). A shorter plan must never cost more.`,
      });
    }
  }

  return { errors, basePrice: price, checkpoints: shapeOk ? list.map((c) => ({ months: c.months, discount_pct: c.discount_pct })).sort((a, b) => b.months - a.months) : undefined };
}

/** Like the backend: a generic sentence, with every problem in the body's `errors[]`. */
export function failValidation(errors: MockPricingError[]): never {
  throw new MockHttpError(
    400,
    'The pricing has problems. Fix every item in errors and try again.',
    'PRICING_VALIDATION_FAILED',
    { errors }
  );
}

/* -------------------- state -------------------- */

type SeedPlan = { tenor_months: number; land_price: number; is_active: boolean };

/**
 * The first two Flex sizes of every asset are seeded on a base plan (two versions, so
 * the editor opens as “Draft v3 · based on v2”) and the rest stay on their
 * hand-entered tenor list, so both states exist to render and the conversion
 * path can be exercised. A size created with no plans is `unpriced`.
 */
export function ensurePricingState(size: { _id: string; plans: SeedPlan[] }, ctx: { isFlex: boolean; index: number }): MockPricingState | null {
  if (!ctx.isFlex) return null;
  const existing = states[size._id];
  if (existing) return existing;

  const plan36 = size.plans.find((plan) => plan.tenor_months === 36 && plan.is_active);
  let state: MockPricingState;

  if (size.plans.length === 0) {
    state = { mode: 'unpriced', versions: [], draft: null };
  } else if (ctx.index <= 1 && plan36) {
    state = {
      mode: 'base_plan',
      versions: [
        {
          version: 1,
          based_on_version: null,
          base_price_per_unit: plan36.land_price,
          checkpoints: [{ months: 24, discount_pct: 4 }, { months: 12, discount_pct: 12 }],
          published_by: { id: 'u_2', name: 'A. Bello' },
          published_at: '2026-09-14T15:40:00.000Z',
          purchase_count: 11,
          pending_transfer_count: 2,
        },
        {
          version: 2,
          based_on_version: 1,
          base_price_per_unit: plan36.land_price,
          checkpoints: [{ months: 24, discount_pct: 5 }, { months: 12, discount_pct: 15 }],
          published_by: { id: 'u_2', name: 'A. Bello' },
          published_at: '2026-10-05T08:12:00.000Z',
          purchase_count: 3,
          pending_transfer_count: 0,
        },
      ],
      draft: null,
    };
  } else {
    state = { mode: 'tenor_list', versions: [], draft: null };
  }

  states[size._id] = state;
  return state;
}

export function getPricingState(sizeId: string): MockPricingState | undefined {
  return states[sizeId];
}

export function liveVersion(state: MockPricingState): MockPricingVersion | null {
  return state.versions.length > 0 ? state.versions[state.versions.length - 1] : null;
}

/** Payments for a version's standard 36-month plan. */
export function basePayments(version: Pick<MockPricingVersion, 'base_price_per_unit' | 'checkpoints'>) {
  const row = previewRowsFor(version.base_price_per_unit, version.checkpoints).find((r) => r.is_base)!;
  return { first_payment: row.regular_payment, monthly_payment: row.regular_payment, final_payment: row.final_payment };
}

/** The fields a size gains on the detail tree (contract §3.1). */
export function sizePricingFields(state: MockPricingState | null, plans: unknown[]) {
  if (!state) return { pricing_mode: 'tenor_list' as const, pricing: null, plans };
  if (state.mode === 'tenor_list') return { pricing_mode: 'tenor_list' as const, pricing: null, plans };

  const live = liveVersion(state);
  return {
    pricing_mode: state.mode,
    pricing: live
      ? {
          live_version: live.version,
          base_tenor_months: 36,
          base_price_per_unit: live.base_price_per_unit,
          ...basePayments(live),
          checkpoints: live.checkpoints,
          published_at: live.published_at,
          published_by: live.published_by,
          has_draft: state.draft !== null,
        }
      : null,
    plans: [],
  };
}

/** Counts shown against a pricing history entry (“3 purchases so far”, “now superseded”). */
export function versionStats(sizeId: string, version: number) {
  const state = states[sizeId];
  const stored = state?.versions.find((candidate) => candidate.version === version);
  const live = state ? liveVersion(state) : null;
  return {
    purchase_count: stored?.purchase_count ?? 0,
    pending_transfer_count: stored?.pending_transfer_count ?? 0,
    superseded: Boolean(stored && live && live.version !== version),
  };
}
