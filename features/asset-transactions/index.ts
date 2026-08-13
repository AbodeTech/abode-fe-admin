/* Asset transactions — purchase rows, on REST against GET /admin/transactions.
 *
 * One list for all asset purchases; the flex/full-ownership split is a row
 * property (`purchase_details.transaction_kind`), not a page split.
 *
 * Buyer, referrer and property are populated and every filter is live as of
 * 2026-08-13 (tickets 24a/b/d). Two things still differ from the screen this
 * replaces: production's **Property Owner** column has no v2 field and no known
 * equivalent (⛔ ticket 24b), and **full-ownership rows carry no Review action**
 * — their review lives at /admin/fo/purchase/transactions/:txId/*, a separate
 * family this feature does not call yet. The stat cards run on labelled sample
 * data; there is still no stats endpoint.
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
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  PURCHASE_STATUSES,
  PURCHASE_STATUS_LABELS,
  SALES_TYPES,
  SALES_TYPE_LABELS,
  isReviewablePurchase,
  kindLabel,
} from './schemas/purchase.schema';
export type {
  AssetType,
  Purchase,
  PurchaseStatus,
  SalesType,
} from './schemas/purchase.schema';
