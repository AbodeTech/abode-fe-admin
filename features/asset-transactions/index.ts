/* Asset transactions — purchase rows, on REST against GET /admin/transactions.
 *
 * One list for all asset purchases; the flex/full-ownership split is a row
 * property (`purchase_details.transaction_kind`), not a page split. Review
 * actions are per-family: flex today, full-ownership when the backend builds
 * its purchase flow at all (docs/BACKEND-REQUESTS.md).
 *
 * The old screen's search, richer filters and stat cards are kept visible:
 * search and the unsupported filters render disabled, the cards run on
 * labelled sample data — no silent degradation, no dropped visuals.
 */

export { PurchasesTable } from './components/PurchasesTable';
export { PurchaseFilters } from './components/PurchaseFilters';
export { PurchaseStatCards } from './components/PurchaseStatCards';
export { PurchaseStatusBadge } from './components/PurchaseStatusBadge';
export { ReviewPurchaseDialog } from './components/ReviewPurchaseDialog';

export { usePurchases, DEFAULT_PURCHASE_LIMIT } from './hooks/use-purchases';
export { useApproveFlexPurchase, useDeclineFlexPurchase } from './hooks/use-purchase-review';
export type { PurchaseListFilters } from './hooks/query-keys';

export {
  PURCHASE_STATUSES,
  PURCHASE_STATUS_LABELS,
  isReviewablePurchase,
  kindLabel,
} from './schemas/purchase.schema';
export type { Purchase, PurchaseStatus } from './schemas/purchase.schema';
