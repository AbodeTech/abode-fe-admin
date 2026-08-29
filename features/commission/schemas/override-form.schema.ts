import { z } from 'zod';

import { OfferTypeSchema, type TierRates } from './commission.schema';
import { refId, type NormalisedOverride } from './override.schema';

/* ============================================================
 * Override create/edit forms.
 *
 * Rates are entered as percentages and stored as fractions — the same
 * convention as the config form, converted in one place.
 *
 * Asset overrides set a rate **per tier** (they name an asset, so tier still
 * decides). User and asset+user overrides set a **single number per leg**
 * (they already name the person). Two shapes, deliberately not merged.
 * ============================================================ */

const percentField = z
  .number({ message: 'Enter a percentage' })
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100%');

/** Optional tier rate — blank means "don't set this tier", not zero. */
const optionalPercent = z
  .union([percentField, z.nan(), z.literal('')])
  .optional()
  .transform((value) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined));

const optionalTiers = z.object({
  founder: optionalPercent,
  'associate-pro': optionalPercent,
  premium: optionalPercent,
  default: optionalPercent,
});

export const assetOverrideFormSchema = z
  .object({
    asset_id: z.string().min(1, 'Choose an asset'),
    offer_type: OfferTypeSchema,
    direct: optionalTiers,
    upline: optionalTiers,
    topline: optionalTiers,
    reason: z.string().max(500, 'Keep the reason under 500 characters').optional(),
    expires_at: z.string().optional(),
  })
  .refine(
    (values) => Object.values(values.direct).some((rate) => rate !== undefined),
    {
      // `direct` is required by the BE schema; the other two legs are optional.
      message: 'Set at least one direct rate',
      path: ['direct'],
    }
  );

export type AssetOverrideFormValues = z.input<typeof assetOverrideFormSchema>;
export type AssetOverrideFormOutput = z.output<typeof assetOverrideFormSchema>;

/**
 * Exactly the fields `CreateAssetOverrideDto` declares.
 *
 * `forbidNonWhitelisted` makes an unknown field a hard 400, so `_id`,
 * `revoked_at` and `granted_by` are never sent — `granted_by` is taken from
 * the admin JWT server-side.
 */
export type AssetOverridePayload = {
  asset_id: string;
  offer_type: z.infer<typeof OfferTypeSchema>;
  direct: TierRates;
  upline?: TierRates;
  topline?: TierRates;
  reason?: string;
  expires_at?: string;
};

const toFraction = (percent: number): number => percent / 100;

/** Drops unset tiers entirely rather than sending them as 0. */
function tiersToPayload(tiers: Record<string, number | undefined>): TierRates | undefined {
  const entries = Object.entries(tiers).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number'
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries.map(([tier, percent]) => [tier, toFraction(percent)]));
}

export function assetFormToPayload(values: AssetOverrideFormOutput): AssetOverridePayload {
  const direct = tiersToPayload(values.direct);

  return {
    asset_id: values.asset_id,
    offer_type: values.offer_type,
    // Guaranteed non-empty by the refine above.
    direct: direct ?? {},
    ...(tiersToPayload(values.upline) && { upline: tiersToPayload(values.upline) }),
    ...(tiersToPayload(values.topline) && { topline: tiersToPayload(values.topline) }),
    ...(values.reason?.trim() && { reason: values.reason.trim() }),
    ...(values.expires_at && { expires_at: new Date(values.expires_at).toISOString() }),
  };
}

/** Fraction → percentage input, with the float guard the config form uses. */
const toPercentInput = (fraction: number | undefined): number | undefined =>
  fraction === undefined ? undefined : Number((fraction * 100).toFixed(4));

function tiersToForm(rates: TierRates | undefined) {
  return {
    founder: toPercentInput(rates?.founder),
    'associate-pro': toPercentInput(rates?.['associate-pro']),
    premium: toPercentInput(rates?.premium),
    default: toPercentInput(rates?.default),
  };
}

const EMPTY_TIERS = tiersToForm(undefined);

/**
 * Seed the form for an edit. Typed from the normalised row, never a
 * hand-written shape.
 */
export function assetOverrideToForm(override: NormalisedOverride): AssetOverrideFormValues {
  const tiered = (leg: 'direct' | 'upline' | 'topline') => {
    const rate = override.rates[leg];
    return rate?.kind === 'tiered' ? tiersToForm(rate.rates) : EMPTY_TIERS;
  };

  return {
    asset_id: refId(override.asset) ?? '',
    offer_type: override.offerType,
    direct: tiered('direct'),
    upline: tiered('upline'),
    topline: tiered('topline'),
    reason: override.reason ?? '',
    expires_at: override.expiresAt ? override.expiresAt.slice(0, 10) : '',
  };
}

export const emptyAssetOverrideForm = (): AssetOverrideFormValues => ({
  asset_id: '',
  offer_type: 'full-ownership',
  direct: EMPTY_TIERS,
  upline: EMPTY_TIERS,
  topline: EMPTY_TIERS,
  reason: '',
  expires_at: '',
});

/* ============================================================
 * User and asset+user overrides.
 *
 * These name a person, so tier no longer decides — each leg is a single
 * number rather than a tier table.
 *
 * Per-leg (`direct` / `upline` / `topline`) since 2026-07-28, when ticket 8
 * resolved. The form modelled all three legs from the start, so resolving the
 * ticket meant enabling the inputs and changing the payload — not a redesign.
 * ============================================================ */

export const subjectOverrideFormSchema = z
  .object({
    /** Required for asset+user overrides, absent for user overrides. */
    asset_id: z.string().optional(),
    user_id: z.string().min(1, 'Choose a referrer'),
    offer_type: OfferTypeSchema,
    direct: optionalPercent,
    upline: optionalPercent,
    topline: optionalPercent,
    reason: z.string().max(500, 'Keep the reason under 500 characters').optional(),
    expires_at: z.string().optional(),
  })
  // At least one leg — an override with no rates would beat lower levels of
  // the chain with nothing. Any single leg is legitimate on its own: a
  // full-ownership upline-only override leaves direct falling through.
  .refine(
    (values) =>
      values.direct !== undefined || values.upline !== undefined || values.topline !== undefined,
    { message: 'Enter a rate for at least one leg', path: ['direct'] }
  );

export type SubjectOverrideFormValues = z.input<typeof subjectOverrideFormSchema>;
export type SubjectOverrideFormOutput = z.output<typeof subjectOverrideFormSchema>;

/**
 * `CreateUserOverrideDto` / `CreateAssetUserOverrideDto` — per-leg since
 * 2026-07-28 (ticket 8 resolved; the DTOs extend `TierRatesDto`).
 *
 * The old single `rate` field is **gone from the DTO**, so sending it is a
 * hard 400 under `forbidNonWhitelisted`. The BE ships a migration script that
 * rewrites stored `rate` values into `direct`, so reads see per-leg too.
 */
export type SubjectOverridePayload = {
  user_id: string;
  asset_id?: string;
  offer_type: z.infer<typeof OfferTypeSchema>;
  direct?: number;
  upline?: number;
  topline?: number;
  reason?: string;
  expires_at?: string;
};

export function subjectFormToPayload(
  values: SubjectOverrideFormOutput,
  options: { includeAsset: boolean }
): SubjectOverridePayload {
  return {
    user_id: values.user_id,
    ...(options.includeAsset && values.asset_id ? { asset_id: values.asset_id } : {}),
    offer_type: values.offer_type,
    ...(values.direct !== undefined && { direct: toFraction(values.direct) }),
    ...(values.upline !== undefined && { upline: toFraction(values.upline) }),
    ...(values.topline !== undefined && { topline: toFraction(values.topline) }),
    ...(values.reason?.trim() && { reason: values.reason.trim() }),
    ...(values.expires_at && { expires_at: new Date(values.expires_at).toISOString() }),
  };
}

export function subjectOverrideToForm(override: NormalisedOverride): SubjectOverrideFormValues {
  const flat = (leg: 'direct' | 'upline' | 'topline') => {
    const rate = override.rates[leg];
    return rate?.kind === 'flat' ? toPercentInput(rate.rate) : undefined;
  };

  return {
    asset_id: refId(override.asset) ?? '',
    user_id: refId(override.user) ?? '',
    offer_type: override.offerType,
    direct: flat('direct'),
    upline: flat('upline'),
    topline: flat('topline'),
    reason: override.reason ?? '',
    expires_at: override.expiresAt ? override.expiresAt.slice(0, 10) : '',
  };
}

export const emptySubjectOverrideForm = (): SubjectOverrideFormValues => ({
  asset_id: '',
  user_id: '',
  offer_type: 'full-ownership',
  direct: undefined,
  upline: undefined,
  topline: undefined,
  reason: '',
  expires_at: '',
});
