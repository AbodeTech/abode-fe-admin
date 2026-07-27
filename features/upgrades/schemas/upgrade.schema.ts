import { z } from 'zod';

/* ============================================================
 * Associate upgrade queue — the admin approval surface.
 *
 * Mirrors abode-be-v2's `ReferralUpgrade` and `UpgradeQueryDto`.
 *
 * ⛔ ticket 13 — `findUpgradesPaginated` applies no `.populate()`, so `user`
 * and `referrer` arrive as bare ObjectIds. The ref schemas accept a string OR a
 * populated object, so names appear with no rework once the backend populates.
 * Until then the UI renders an em-dash and keeps the id reachable.
 * ============================================================ */

export const USER_TIERS = [
  'guest',
  'user',
  'associate',
  'associate-pro',
  'founder',
  'management',
  'premium',
  'agency',
] as const;

export const UserTierSchema = z.enum(USER_TIERS);
export type UserTier = z.infer<typeof UserTierSchema>;

export const USER_TIER_LABELS: Record<UserTier, string> = {
  guest: 'Guest',
  user: 'User',
  associate: 'Associate',
  'associate-pro': 'Associate Pro',
  founder: 'Founder',
  management: 'Management',
  premium: 'Premium',
  agency: 'Agency',
};

/** Tiers an admin can upgrade someone *to*. Guest and user aren't upgrades. */
export const UPGRADE_TARGET_TIERS = [
  'associate',
  'associate-pro',
  'founder',
  'premium',
  'management',
] as const satisfies readonly UserTier[];

export const UPGRADE_STATUSES = ['pending', 'approved', 'declined', 'cancelled'] as const;
export const UpgradeStatusSchema = z.enum(UPGRADE_STATUSES);
export type UpgradeStatus = z.infer<typeof UpgradeStatusSchema>;

export const UPGRADE_STATUS_LABELS: Record<UpgradeStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const UPGRADE_PAYMENT_METHODS = ['transfer', 'paystack', 'admin-manual'] as const;
export const UpgradePaymentMethodSchema = z.enum(UPGRADE_PAYMENT_METHODS);
export type UpgradePaymentMethod = z.infer<typeof UpgradePaymentMethodSchema>;

export const UPGRADE_PAYMENT_METHOD_LABELS: Record<UpgradePaymentMethod, string> = {
  transfer: 'Bank transfer',
  paystack: 'Paystack',
  'admin-manual': 'Recorded by admin',
};

/* -------------------- references -------------------- */

/**
 * ⛔ ticket 13 — a bare ObjectId today, a populated person once the backend
 * populates. Accepting both means no rework when it lands.
 */
export const PersonRefSchema = z.union([
  z.string(),
  z.object({
    _id: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    userName: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
  }),
]);
export type PersonRef = z.infer<typeof PersonRefSchema>;

export function personId(ref: PersonRef | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref._id;
}

/** Null while the backend returns ids — the UI shows an em-dash for that. */
export function personName(ref: PersonRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  const full = [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim();
  return full || ref.userName || ref.email || null;
}

export function personEmail(ref: PersonRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  return ref.email ?? null;
}

export function personPhone(ref: PersonRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  return ref.phoneNumber ?? null;
}

/* -------------------- entity -------------------- */

/**
 * One row of the approval queue.
 *
 * `fee_amount`, `original_amount` and `discount_amount` are decimal naira.
 * The transfer evidence fields (`bank_name`, `reference_no`, `file_url`) are
 * populated for user-initiated transfer upgrades and null otherwise — note
 * `file_url` is lowercase; the pre-migration frontend spelled it `file_Url`,
 * which silently resolved to undefined and hid the receipt.
 */
export const UpgradeSchema = z.object({
  _id: z.string(),
  user: PersonRefSchema,
  referrer: PersonRefSchema.nullable().optional(),

  from_tier: UserTierSchema,
  to_tier: UserTierSchema,

  fee_amount: z.number(),
  payment_method: UpgradePaymentMethodSchema,
  status: UpgradeStatusSchema,

  transaction: z.string().nullable().optional(),

  bank_name: z.string().nullable().optional(),
  reference_no: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),

  coupon: z.string().nullable().optional(),
  coupon_code_snapshot: z.string().nullable().optional(),
  original_amount: z.number().nullable().optional(),
  discount_amount: z.number().nullable().optional(),

  reviewed_by: PersonRefSchema.nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  decline_reason: z.string().nullable().optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Upgrade = z.infer<typeof UpgradeSchema>;

/* -------------------- decline -------------------- */

/** The BE enforces this minimum and rejects with DECLINE_REASON_TOO_SHORT. */
export const DECLINE_REASON_MIN = 20;
export const DECLINE_REASON_MAX = 500;

export const declineUpgradeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(DECLINE_REASON_MIN, `Give at least ${DECLINE_REASON_MIN} characters — the applicant sees this`)
    .max(DECLINE_REASON_MAX, `Keep it under ${DECLINE_REASON_MAX} characters`),
});

export type DeclineUpgradeValues = z.infer<typeof declineUpgradeSchema>;
