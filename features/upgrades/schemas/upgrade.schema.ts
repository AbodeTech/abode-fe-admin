import { z } from 'zod';

/* ============================================================
 * Associate upgrade queue — the admin approval surface.
 *
 * Mirrors abode-be-v2's `ReferralUpgrade`, `UpgradeQueryDto` and
 * `ManualUpgradeDto`.
 *
 * All three person refs are populated on the queue (tickets 13 and 22):
 * `user` with `firstName lastName email userName phoneNumber referral_status`,
 * `referrer` with the same minus `referral_status`, and `reviewed_by` with
 * `firstName lastName`.
 *
 * The ref schemas still accept a bare id, which is not dead code: approve,
 * decline and manual-upgrade all return the upgrade **unpopulated**, because
 * they re-read it with a plain `findUpgradeById`.
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
 * A populated person, or a bare ObjectId where the endpoint doesn't populate.
 * Accepting both is what lets one call site render either state.
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

/**
 * Null when the ref is a bare id — the UI shows an em-dash for that.
 *
 * Order is **lastName firstName**, the platform convention for every full-name
 * display (see the standardisation on `fix/name-display-order`). Not
 * firstName-first, even though most of this repo's older code reads that way.
 */
export function personName(ref: PersonRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  const full = [ref.lastName, ref.firstName].filter(Boolean).join(' ').trim();
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

/* -------------------- manual upgrade -------------------- */

/**
 * `POST /admin/users/:id/manual-upgrade` — record an upgrade paid off-platform,
 * or change a tier for free.
 *
 * Mirrors `ManualUpgradeDto`. The BE runs `forbidNonWhitelisted`, so the payload
 * must carry exactly these keys — `fee_amount` and `pay_commission` are omitted
 * entirely rather than sent as null when unused.
 *
 * The backend's behaviour this form has to respect:
 *
 * - `fee_amount > 0` writes a Transaction and is what commission is calculated
 *   on. There is no separate commissionable amount.
 * - `pay_commission` does nothing unless `fee_amount > 0` **and** the user has a
 *   referrer. Both are enforced here so the admin isn't told commission will pay
 *   when it silently won't.
 * - A fee against a user with no wallet fails with `PAYSTACK_INIT_FAILED` and
 *   `reason: 'User has no wallet'` — surfaced verbatim, since the code alone
 *   reads as a Paystack outage.
 */
export const MANUAL_UPGRADE_REASON_MIN = 20;
export const MANUAL_UPGRADE_REASON_MAX = 500;

export const manualUpgradeSchema = z
  .object({
    user_id: z.string().trim().min(1, 'Choose who to upgrade'),
    to_tier: z.enum(UPGRADE_TARGET_TIERS, { message: 'Choose a tier' }),
    /** Empty string = no fee recorded, i.e. a free tier change. */
    fee_amount: z
      .string()
      .trim()
      .refine((value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), {
        message: 'Enter an amount of 0 or more, or leave blank for a free change',
      }),
    pay_commission: z.boolean(),
    reason: z
      .string()
      .trim()
      .min(
        MANUAL_UPGRADE_REASON_MIN,
        `Give at least ${MANUAL_UPGRADE_REASON_MIN} characters — this is the audit trail`
      )
      .max(MANUAL_UPGRADE_REASON_MAX, `Keep it under ${MANUAL_UPGRADE_REASON_MAX} characters`),
  })
  .refine((values) => !values.pay_commission || Number(values.fee_amount) > 0, {
    path: ['pay_commission'],
    message: 'Commission is a percentage of the fee, so it needs a fee above zero',
  });

export type ManualUpgradeValues = z.infer<typeof manualUpgradeSchema>;

/** The request body — exactly `ManualUpgradeDto`, with blanks dropped. */
export type ManualUpgradePayload = {
  to_tier: UserTier;
  reason: string;
  fee_amount?: number;
  pay_commission?: boolean;
};

export function toManualUpgradePayload(values: ManualUpgradeValues): ManualUpgradePayload {
  const fee = values.fee_amount === '' ? null : Number(values.fee_amount);

  return {
    to_tier: values.to_tier,
    reason: values.reason,
    ...(fee !== null && { fee_amount: fee }),
    ...(fee !== null && fee > 0 && values.pay_commission && { pay_commission: true }),
  };
}
