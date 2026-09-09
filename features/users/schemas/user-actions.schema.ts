import { z } from 'zod';

import { USER_TIERS, UserTierSchema } from './user.schema';

export const ADMIN_REASON_MIN = 20;
export const ADMIN_REASON_MAX = 2000;

export const AdminReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(ADMIN_REASON_MIN, `Reason must be at least ${ADMIN_REASON_MIN} characters`)
    .max(ADMIN_REASON_MAX),
  notify_user: z.boolean().optional(),
});

export type AdminReasonInput = z.infer<typeof AdminReasonSchema>;

export const MessageAckSchema = z.looseObject({
  message: z.string().optional(),
});

export const AdminUserProfilePayloadSchema = z.object({
  notify_user: z.boolean().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  gender: z.enum(['male', 'female']).nullable().optional(),
  marital_status: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  employment_status: z.string().nullable().optional(),
  education_level: z.string().nullable().optional(),
  experience_level: z.string().nullable().optional(),
});

export type AdminUserProfilePayload = z.infer<typeof AdminUserProfilePayloadSchema>;

export const SuspendUserPayloadSchema = AdminReasonSchema.extend({
  expires_at: z.string().optional(),
});

export type SuspendUserPayload = z.infer<typeof SuspendUserPayloadSchema>;

export const SetUserTinPayloadSchema = AdminReasonSchema.extend({
  tin: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^(?:\d{11}|N-[A-Za-z0-9-]+)$/, 'TIN must be 11 digits or an N-prefixed tax id'),
});

export type SetUserTinPayload = z.infer<typeof SetUserTinPayloadSchema>;

export const WALLET_ADJUSTMENT_CATEGORIES = [
  'generic',
  'refund',
  'goodwill',
  'migration',
  'dispute',
] as const;

export const AdminWalletAdjustPayloadSchema = AdminReasonSchema.extend({
  direction: z.enum(['credit', 'debit']),
  amount: z.number().int().positive(),
  reason_category: z.enum(WALLET_ADJUSTMENT_CATEGORIES).optional(),
  related_transaction_id: z.string().optional(),
});

export type AdminWalletAdjustPayload = z.infer<typeof AdminWalletAdjustPayloadSchema>;

export const WalletAdjustResultSchema = z.looseObject({
  transaction_id: z.string(),
  new_balance: z.number(),
});

export const ADMIN_REFERRAL_TIERS = USER_TIERS.filter((tier) => tier !== 'agency');

export const AdminReferralTierSchema = UserTierSchema.exclude(['agency']);

export const ChangeTierPayloadSchema = AdminReasonSchema.extend({
  new_tier: AdminReferralTierSchema,
});

export type ChangeTierPayload = z.infer<typeof ChangeTierPayloadSchema>;

export const ChangeTierResultSchema = z.looseObject({
  user_id: z.string(),
  referral_status: z.string(),
});

export const AddReferralPayloadSchema = AdminReasonSchema.extend({
  referee_email: z.string().trim().email(),
});

export type AddReferralPayload = z.infer<typeof AddReferralPayloadSchema>;

export const AddReferralResultSchema = z.looseObject({
  referral_id: z.string(),
  referee_id: z.string(),
});

export const ReassignReferrerPayloadSchema = AdminReasonSchema.extend({
  new_referrer_username: z.string().trim().min(1, 'Referrer username is required'),
});

export type ReassignReferrerPayload = z.infer<typeof ReassignReferrerPayloadSchema>;

export const ReassignReferrerResultSchema = z.looseObject({
  user_id: z.string(),
  new_referrer: z.string(),
  reason: z.string().optional(),
});
