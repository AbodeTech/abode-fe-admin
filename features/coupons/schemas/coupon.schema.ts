import { z } from 'zod';

/* ============================================================
 * Admin coupons — mirrors abode-be-v2 promotion module (coupon-v2).
 *
 * Paths: /api/v1/admin/coupons*
 * Permission: manage_promotions
 * ============================================================ */

export const COUPON_APPLY_SITES = ['associate-pro-upgrade', 'client-request'] as const;
export const CouponApplySiteSchema = z.enum(COUPON_APPLY_SITES);
export type CouponApplySite = z.infer<typeof CouponApplySiteSchema>;

export const COUPON_APPLY_SITE_LABELS: Record<CouponApplySite, string> = {
  'associate-pro-upgrade': 'Associate Pro upgrade',
  'client-request': 'Client request',
};

export const COUPON_STATUSES = ['pending', 'active', 'paused', 'expired'] as const;
export const CouponStatusSchema = z.enum(COUPON_STATUSES);
export type CouponStatus = z.infer<typeof CouponStatusSchema>;

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  paused: 'Paused',
  expired: 'Expired',
};

/** Manual status targets for PATCH /admin/coupons/:code/status */
export const MANUAL_COUPON_STATUSES = ['active', 'paused', 'expired'] as const;
export const ManualCouponStatusSchema = z.enum(MANUAL_COUPON_STATUSES);
export type ManualCouponStatus = z.infer<typeof ManualCouponStatusSchema>;

export const COUPON_USAGE_LIMIT_TYPES = ['unlimited', 'limited'] as const;
export const CouponUsageLimitTypeSchema = z.enum(COUPON_USAGE_LIMIT_TYPES);
export type CouponUsageLimitType = z.infer<typeof CouponUsageLimitTypeSchema>;

export const COUPON_EXPIRY_TYPES = ['no_expiry', 'expires_on'] as const;
export const CouponExpiryTypeSchema = z.enum(COUPON_EXPIRY_TYPES);
export type CouponExpiryType = z.infer<typeof CouponExpiryTypeSchema>;

export const CouponSchema = z.object({
  _id: z.string(),
  couponCode: z.string(),
  discount_percentage: z.number(),
  max_discount_amount: z.number().nullable().optional(),
  applies_to: z.array(CouponApplySiteSchema).min(1),
  usage_limit_type: CouponUsageLimitTypeSchema,
  usage_limit: z.number().nullable().optional(),
  usage_count: z.number().optional(),
  max_uses_per_user: z.number().nullable().optional(),
  expiry_type: CouponExpiryTypeSchema,
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  activates_immediately: z.boolean().optional(),
  status: CouponStatusSchema,
  paused_reason: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Coupon = z.infer<typeof CouponSchema>;

export type CreateCouponInput = {
  couponCode: string;
  discount_percentage: number;
  max_discount_amount?: number | null;
  applies_to: CouponApplySite[];
  usage_limit_type: CouponUsageLimitType;
  usage_limit?: number | null;
  max_uses_per_user?: number | null;
  expiry_type: CouponExpiryType;
  starts_at?: string | null;
  ends_at?: string | null;
  activates_immediately?: boolean;
};

export type UpdateCouponInput = {
  discount_percentage?: number;
  max_discount_amount?: number | null;
  applies_to?: CouponApplySite[];
  usage_limit_type?: CouponUsageLimitType;
  usage_limit?: number | null;
  max_uses_per_user?: number | null;
  expiry_type?: CouponExpiryType;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type UpdateCouponStatusInput = {
  status: ManualCouponStatus;
  reason?: string;
};
