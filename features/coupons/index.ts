/**
 * Coupons — discount codes for associate-pro upgrades (and optionally other
 * apply-sites). Wired to abode-be-v2 `/api/v1/admin/coupons*` (coupon-v2).
 *
 * Requires admin permission `manage_promotions`.
 *
 * Route remains `/associate-upgrade/coupons`.
 */

// Components
export { CouponsTable } from './components/CouponsTable';
export { CouponFilters } from './components/CouponFilters';
export { CreateCouponDialog } from './components/CreateCouponDialog';
export { EditCouponDialog } from './components/EditCouponDialog';

// Hooks
export {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useUpdateCouponStatus,
  useDeleteCoupon,
} from './hooks/use-coupons';

// Schemas
export type {
  Coupon,
  CouponStatus,
  CreateCouponInput,
  UpdateCouponInput,
  ManualCouponStatus,
} from './schemas/coupon.schema';
