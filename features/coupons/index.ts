/**
 * Coupons — discount codes applied at checkout.
 *
 * **Still on GraphQL.** abode-be-v2's promotion module is unchanged from v1:
 * no apply-site scoping, no per-user cap, no discount cap, no redemption log,
 * and `incrementUsage` is an unconditional `$inc` — the check-then-write race
 * the v2 design exists to fix. This feature is rewritten when that backend
 * lands, not before.
 *
 * Coupons are a shared service, not part of associate upgrades — hence this
 * folder rather than the old `features/associate-upgrade`. The route is still
 * `/associate-upgrade/coupons`; moving it is a product call, best made when
 * the screens are rebuilt against the real API.
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
