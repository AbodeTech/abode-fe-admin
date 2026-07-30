import { z } from 'zod';

import {
  CommissionLegSchema,
  OfferTypeSchema,
  OverrideSourceSchema,
  TierRatesSchema,
  type CommissionLeg,
  type OfferType,
  type TierRates,
} from './commission.schema';

/* ============================================================
 * Commission rate overrides — the exceptions that beat the defaults.
 *
 * Three collections, resolved most-specific-first:
 *   asset+user → user → asset → default
 *
 * Tickets 9a (populate) and 8 (per-leg rates) landed 2026-07-28. The unions
 * written to tolerate their absence stay: refs accept a bare ObjectId string
 * OR a populated object, and subject overrides accept legacy flat `rate` OR
 * per-leg — documents written before the backend's migration still parse.
 * ============================================================ */

export const OVERRIDE_TYPES = ['asset', 'user', 'asset-user'] as const;
export const OverrideTypeSchema = z.enum(OVERRIDE_TYPES);
export type OverrideType = z.infer<typeof OverrideTypeSchema>;

export const OVERRIDE_TYPE_LABELS: Record<OverrideType, string> = {
  asset: 'Asset',
  user: 'User',
  'asset-user': 'Asset + user',
};

/* -------------------- references -------------------- */

/**
 * Populated by `listOverrides` since 2026-07-28 (ticket 9a) — assets with
 * `name`, users with `firstName lastName email referral_status`. A deleted
 * target still arrives as a bare ObjectId string, so the union stays. Read
 * through the helpers below rather than branching on it at every call site.
 */
export const AssetRefSchema = z.union([
  z.string(),
  z.object({
    _id: z.string(),
    /** abode-be-v2's Asset schema calls this `name`. */
    name: z.string().nullable().optional(),
    /** v1 called it `asset_name`; tolerated so a legacy shape still renders. */
    asset_name: z.string().nullable().optional(),
  }),
]);
export type AssetRef = z.infer<typeof AssetRefSchema>;

export const UserRefSchema = z.union([
  z.string(),
  z.object({
    _id: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    /** Sent by the list populate since 2026-07-28 (`ticket 9a`). */
    referral_status: z.string().nullable().optional(),
  }),
]);
export type UserRef = z.infer<typeof UserRefSchema>;

export const AdminRefSchema = z.union([
  z.string(),
  z.object({
    _id: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  }),
]);
export type AdminRef = z.infer<typeof AdminRefSchema>;

type AnyRef = AssetRef | UserRef | AdminRef;

export function refId(ref: AnyRef | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref._id;
}

/**
 * Asset and person names are read separately rather than through one helper.
 * Every field on these refs is optional, so `'asset_name' in ref` cannot narrow
 * the union — and call sites always know which kind of ref they hold anyway.
 *
 * Both return null for a bare-id ref (an unpopulated or deleted target); the
 * caller falls back to the id.
 */
export function assetRefName(ref: AssetRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  return ref.name ?? ref.asset_name ?? null;
}

export function personRefName(ref: UserRef | AdminRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;

  const full = [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim();
  return full || ref.email || null;
}

/* -------------------- entities -------------------- */

const OverrideBaseSchema = z.object({
  _id: z.string(),
  offer_type: OfferTypeSchema,
  reason: z.string().nullable().optional(),
  granted_by: AdminRefSchema.nullable().optional(),
  expires_at: z.string().nullable().optional(),
  revoked_at: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * Applies to every referrer selling one asset. Rates are **per tier**, because
 * the override names an asset rather than a person — tier still decides.
 */
export const AssetOverrideSchema = OverrideBaseSchema.extend({
  asset_id: AssetRefSchema,
  direct: TierRatesSchema,
  upline: TierRatesSchema.optional(),
  topline: TierRatesSchema.optional(),
});
export type AssetOverride = z.infer<typeof AssetOverrideSchema>;

/**
 * Applies to one referrer across any asset. Rates are **flat numbers** — the
 * override already names the person, so tier doesn't enter into it.
 *
 * Per-leg (`direct`/`upline`/`topline`) since 2026-07-28 (ticket 8). The
 * legacy flat `rate` is still accepted on reads — `normaliseOverride` treats a
 * lone `rate` as `direct`, which is what it meant when it was written.
 */
export const UserOverrideSchema = OverrideBaseSchema.extend({
  user_id: UserRefSchema,
  rate: z.number().nullable().optional(),
  // The BE upsert writes `?? null`, so an unset leg arrives as an explicit
  // null on documents saved since per-leg landed — absent only on older ones.
  direct: z.number().nullable().optional(),
  upline: z.number().nullable().optional(),
  topline: z.number().nullable().optional(),
});
export type UserOverride = z.infer<typeof UserOverrideSchema>;

/** The most specific override — one referrer, one asset. Same shape as user. */
export const AssetUserOverrideSchema = OverrideBaseSchema.extend({
  asset_id: AssetRefSchema,
  user_id: UserRefSchema,
  rate: z.number().nullable().optional(),
  // The BE upsert writes `?? null`, so an unset leg arrives as an explicit
  // null on documents saved since per-leg landed — absent only on older ones.
  direct: z.number().nullable().optional(),
  upline: z.number().nullable().optional(),
  topline: z.number().nullable().optional(),
});
export type AssetUserOverride = z.infer<typeof AssetUserOverrideSchema>;

/** GET /admin/commission/overrides returns the three collections separately. */
export const OverrideListResponseSchema = z.object({
  asset: z.array(AssetOverrideSchema),
  user: z.array(UserOverrideSchema),
  asset_user: z.array(AssetUserOverrideSchema),
});
export type OverrideListResponse = z.infer<typeof OverrideListResponseSchema>;

/* -------------------- normalised view -------------------- */

/**
 * An asset override sets a rate per tier; a user override sets one number.
 * The table renders both, so the difference is carried explicitly rather than
 * flattened into a lie.
 */
export type OverrideRate =
  | { kind: 'flat'; rate: number }
  | { kind: 'tiered'; rates: TierRates };

/** One row of the unified overrides table. */
export type NormalisedOverride = {
  id: string;
  type: OverrideType;
  offerType: OfferType;
  asset: AssetRef | null;
  user: UserRef | null;
  rates: Partial<Record<CommissionLeg, OverrideRate>>;
  reason: string | null;
  grantedBy: AdminRef | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
};

const flat = (value: number | null | undefined): OverrideRate | undefined =>
  typeof value === 'number' ? { kind: 'flat', rate: value } : undefined;

const tiered = (rates: TierRates | undefined): OverrideRate | undefined =>
  rates && Object.keys(rates).length > 0 ? { kind: 'tiered', rates } : undefined;

function prune(
  rates: Partial<Record<CommissionLeg, OverrideRate | undefined>>
): Partial<Record<CommissionLeg, OverrideRate>> {
  const out: Partial<Record<CommissionLeg, OverrideRate>> = {};
  for (const leg of CommissionLegSchema.options) {
    const value = rates[leg];
    if (value) out[leg] = value;
  }
  return out;
}

const base = (o: z.infer<typeof OverrideBaseSchema>) => ({
  id: o._id,
  offerType: o.offer_type,
  reason: o.reason ?? null,
  grantedBy: o.granted_by ?? null,
  expiresAt: o.expires_at ?? null,
  revokedAt: o.revoked_at ?? null,
  createdAt: o.createdAt ?? null,
});

/**
 * Flatten the three arrays into one table.
 *
 * Parameters are typed from `z.infer`, never a hand-written shape — a mapper
 * reading a stale shape is the one bug class neither tsc nor Zod catches
 * (see guidelines/Data_Fetching_Guidelines.md).
 */
export function normaliseOverrides(response: OverrideListResponse): NormalisedOverride[] {
  const assets = response.asset.map<NormalisedOverride>((o) => ({
    ...base(o),
    type: 'asset',
    asset: o.asset_id,
    user: null,
    rates: prune({
      direct: tiered(o.direct),
      upline: tiered(o.upline),
      topline: tiered(o.topline),
    }),
  }));

  const users = response.user.map<NormalisedOverride>((o) => ({
    ...base(o),
    type: 'user',
    asset: null,
    user: o.user_id,
    rates: prune({
      // A lone legacy `rate` meant the direct leg (pre-ticket-8 documents).
      direct: flat(o.direct ?? o.rate),
      upline: flat(o.upline),
      topline: flat(o.topline),
    }),
  }));

  const assetUsers = response.asset_user.map<NormalisedOverride>((o) => ({
    ...base(o),
    type: 'asset-user',
    asset: o.asset_id,
    user: o.user_id,
    rates: prune({
      direct: flat(o.direct ?? o.rate),
      upline: flat(o.upline),
      topline: flat(o.topline),
    }),
  }));

  return [...assetUsers, ...users, ...assets];
}

/* -------------------- status -------------------- */

export const OVERRIDE_STATUSES = ['active', 'expiring-soon', 'expired', 'revoked'] as const;
export type OverrideStatus = (typeof OVERRIDE_STATUSES)[number];

const EXPIRING_SOON_DAYS = 7;

/** Derived, never stored — the BE keeps only `expires_at` and `revoked_at`. */
export function overrideStatus(
  override: Pick<NormalisedOverride, 'expiresAt' | 'revokedAt'>,
  now: Date = new Date()
): OverrideStatus {
  if (override.revokedAt) return 'revoked';
  if (!override.expiresAt) return 'active';

  const expires = new Date(override.expiresAt).getTime();
  if (Number.isNaN(expires)) return 'active';
  if (expires <= now.getTime()) return 'expired';

  const daysLeft = (expires - now.getTime()) / 86_400_000;
  return daysLeft <= EXPIRING_SOON_DAYS ? 'expiring-soon' : 'active';
}

/* -------------------- resolve preview -------------------- */

const ResolvedLegSchema = z.object({
  rate: z.number(),
  override_source: OverrideSourceSchema,
  tier: z.string().nullable().optional(),
});

/**
 * ⛔ ticket 9b — `GET /admin/commission/resolve` does not exist yet.
 *
 * Until it does the precedence panel is absent, **not approximated**.
 * Reimplementing the chain client-side would put the resolution rules in two
 * places, where they would drift — the failure this module's design exists to
 * prevent.
 */
export const ResolvePreviewSchema = z.object({
  direct: ResolvedLegSchema.nullable(),
  upline: ResolvedLegSchema.nullable(),
  topline: ResolvedLegSchema.nullable(),
  config_version: z.number(),
  wht_rate: z.number(),
});

export type ResolvePreview = z.infer<typeof ResolvePreviewSchema>;
