import type { CouponApplySite, CouponStatus } from '../schemas/coupon.schema';

/** Mirrors `CouponListQueryDto`. */
export type CouponListFilters = {
  status?: CouponStatus;
  applies_to?: CouponApplySite;
  search?: string;
  page?: number;
  limit?: number;
};

export const couponKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (filters?: CouponListFilters) => [...couponKeys.lists(), filters ?? {}] as const,
};
