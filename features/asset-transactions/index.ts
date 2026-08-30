/* Asset transactions — purchase rows, on REST against GET /admin/transactions.
 *
 * One list for all asset purchases; the flex/full-ownership split is a row
 * property (`purchase_details.transaction_kind`), not a page split.
 *
 * Buyer, referrer and property are populated and every filter is live as of
 * 2026-08-13 (tickets 24a/b/d). Review is
 * POST /admin/acquisitions/transactions/:txId/approve|decline for both families.
 * Full-ownership rows open GET /admin/fo/purchase/transactions/:id.
 *
 * Document fees are the same row shape on their own ledger:
 * GET /admin/transactions/documents (`purchase_kind: 'dev_levy'`), reviewed
 * through that same approve/decline pair.
 * Land plans after approval:
 * POST /admin/acquisitions/plans/:planId/suspend|unsuspend|allocate.
 * `fo_outright_doc` has no Review action — approve the parent land row.
 *
 * Production's **Property Owner** column has no v2 field (⛔ ticket 24b).
 * The stat cards run on labelled sample data; there is still no stats endpoint.
 */

export { PurchasesTable } from './components/PurchasesTable';
export { PurchaseFilters } from './components/PurchaseFilters';
export { PurchaseStatCards } from './components/PurchaseStatCards';
export { PurchaseStatusBadge } from './components/PurchaseStatusBadge';
export { FoTransactionDetail } from './components/FoTransactionDetail';
export { FoPlanActions } from './components/FoPlanActions';
export { ReviewPurchaseDialog } from './components/ReviewPurchaseDialog';
export { DocumentPurchaseExport } from './components/DocumentPurchaseExport';

export { usePurchases, DEFAULT_PURCHASE_LIMIT } from './hooks/use-purchases';
export {
  useDocumentPurchases,
  DEFAULT_DOCUMENT_PURCHASE_LIMIT,
} from './hooks/use-document-purchases';
export { useDocumentPurchaseExport } from './hooks/use-document-purchase-export';
export { useFoTransaction } from './hooks/use-fo-transaction';
export {
  useFoLandPlan,
  useSuspendFoPlan,
  useUnsuspendFoPlan,
  useAllocateFoPlan,
} from './hooks/use-fo-plan';
export { useApprovePurchase, useDeclinePurchase } from './hooks/use-purchase-review';
export type { PurchaseListFilters, DocumentPurchaseListFilters } from './hooks/query-keys';

export {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  PURCHASE_STATUSES,
  PURCHASE_STATUS_LABELS,
  SALES_TYPES,
  SALES_TYPE_LABELS,
  isReviewablePurchase,
  isFoPurchase,
  kindLabel,
} from './schemas/purchase.schema';
export type {
  AssetType,
  Purchase,
  PurchaseReviewFamily,
  PurchaseStatus,
  SalesType,
} from './schemas/purchase.schema';
