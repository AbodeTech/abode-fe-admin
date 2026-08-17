import { z } from 'zod';

/* ============================================================
 * Asset transactions — purchase rows from GET /admin/transactions.
 *
 * v2 keeps ONE stream: every asset purchase is a wallet Transaction with
 * `type: 'purchase'`, flex or (eventually) full-ownership alike. The kind
 * lives in `purchase_details.transaction_kind` — a property of the row, not
 * a mode of the page, exactly like offer types on the assets table.
 *
 * Review is one pair for every asset purchase:
 * POST /admin/acquisitions/transactions/:txId/approve|decline. The BE routes
 * by kind. Approve is a heavy action — it creates the payment plan AND pays
 * commission.
 *
 * `fo_outright_doc` is never reviewed on its own: the BE rejects it with
 * OUTRIGHT_SIBLING_REQUIRED. Action the parent `fo_outright_land` row instead.
 *
 * Amounts are decimal naira.
 * ============================================================ */

export const FLEX_KINDS = ['initial_flex_purchase', 'recurring_flex_payment'] as const;

/**
 * Full-ownership kinds, live since 2026-08-13 (ticket 20). Rows of these kinds
 * can now arrive in this list.
 */
export const FO_KINDS = [
  'fo_outright_land',
  'fo_installment_land',
  'fo_recurring_land',
  'fo_outright_doc',
  'fo_doc_payment',
] as const;

/** FO kinds the admin may POST approve/decline on. Excludes the outright doc sibling. */
export const REVIEWABLE_FO_KINDS = [
  'fo_outright_land',
  'fo_installment_land',
  'fo_recurring_land',
  'fo_doc_payment',
] as const;

export type PurchaseReviewFamily = 'flex' | 'full-ownership';

/** Open vocabulary on the wire — new kinds must not break the table. */
export const KIND_LABELS: Record<string, string> = {
  initial_flex_purchase: 'New purchase · Flex',
  recurring_flex_payment: 'Installment · Flex',
  fo_outright_land: 'Outright · Full ownership',
  fo_installment_land: 'New purchase · Full ownership',
  fo_recurring_land: 'Installment · Full ownership',
  fo_outright_doc: 'Document fee · Full ownership',
  fo_doc_payment: 'Document instalment · Full ownership',
};

export function kindLabel(kind: string | null | undefined): string {
  if (!kind) return '—';
  return KIND_LABELS[kind] ?? kind.replace(/_/g, ' ');
}

/* -------------------- filter vocabularies -------------------- */

/**
 * Mirrors the BE's `transaction-kinds.ts`. Both `sales_type` and `asset_type`
 * narrow the same `purchase_details.transaction_kind` field, and the BE
 * intersects them when both are given — so `dp` + `flex` legitimately returns
 * nothing, since flex has no document payments.
 *
 * `dp` is v2-only: production offered ap/rap alone, but v2 splits document fees
 * into their own kinds, and without a third bucket those rows would match
 * neither filter and vanish from every filtered view.
 */
export const SALES_TYPES = ['ap', 'rap', 'dp'] as const;
export type SalesType = (typeof SALES_TYPES)[number];

export const SALES_TYPE_LABELS: Record<SalesType, string> = {
  ap: 'New purchase',
  rap: 'Instalment',
  dp: 'Document fee',
};

export const ASSET_TYPES = ['flex', 'full-ownership'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full ownership',
};

export const PURCHASE_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
] as const;
export const PurchaseStatusSchema = z.enum(PURCHASE_STATUSES);
export type PurchaseStatus = z.infer<typeof PurchaseStatusSchema>;

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Declined',
  cancelled: 'Cancelled',
};

export const PAYMENT_METHODS = ['paystack', 'wallet', 'transfer', 'system'] as const;
export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  paystack: 'Paystack',
  wallet: 'Wallet',
  transfer: 'Bank transfer',
  system: 'System',
};

/**
 * The deal details frozen on the transaction. Everything optional — the
 * subdocument's fields vary by kind, and `z.looseObject` keeps unknown ones.
 */
export const PurchaseDetailsSchema = z.looseObject({
  transaction_kind: z.string().nullable().optional(),
  payment_plan_id: z.string().nullable().optional(),
  offer_id: z.string().nullable().optional(),
  size_sqm: z.number().nullable().optional(),
  tenor_months: z.number().nullable().optional(),
  /** A string on the BE schema, not a number. */
  no_of_units: z.string().nullable().optional(),
  total_asset_price: z.number().nullable().optional(),
  initial_payment_required: z.number().nullable().optional(),
  monthly_installment: z.number().nullable().optional(),
  balance: z.number().nullable().optional(),
  is_full_payment: z.boolean().nullable().optional(),
  transfer_bank_name: z.string().nullable().optional(),
  transfer_reference_no: z.string().nullable().optional(),
  transfer_receipt_url: z.string().nullable().optional(),
});

export type PurchaseDetails = z.infer<typeof PurchaseDetailsSchema>;

/* -------------------- references (ticket 24a) -------------------- */

/**
 * The buyer, populated with `firstName lastName email referred_by`, where
 * `referred_by` is itself populated with `firstName lastName` — the referrer
 * who earns commission when this purchase is approved (ticket 24b).
 *
 * Still accepts a bare id: the approve/decline responses don't populate.
 */
export const BuyerRefSchema = z.union([
  z.string(),
  z.looseObject({
    _id: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    referred_by: z
      .union([
        z.string(),
        z.looseObject({
          _id: z.string(),
          firstName: z.string().nullable().optional(),
          lastName: z.string().nullable().optional(),
        }),
      ])
      .nullable()
      .optional(),
  }),
]);
export type BuyerRef = z.infer<typeof BuyerRefSchema>;

/** The property, populated with `name asset_location`. */
export const AssetRefSchema = z.union([
  z.string(),
  z.looseObject({
    _id: z.string(),
    name: z.string().nullable().optional(),
    asset_location: z.string().nullable().optional(),
  }),
]);
export type AssetRef = z.infer<typeof AssetRefSchema>;

function refId(ref: BuyerRef | AssetRef | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref._id;
}

export const buyerId = refId;
export const assetId = refId;

/** Names render **lastName firstName**, the platform convention. */
export function buyerName(ref: BuyerRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  const full = [ref.lastName, ref.firstName].filter(Boolean).join(' ').trim();
  return full || ref.email || null;
}

export function buyerEmail(ref: BuyerRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  return ref.email ?? null;
}

/** The buyer's referrer — the person this purchase pays commission to. */
export function referrerId(ref: BuyerRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  const referrer = ref.referred_by;
  if (!referrer) return null;
  return typeof referrer === 'string' ? referrer : referrer._id;
}

export function referrerName(ref: BuyerRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  const referrer = ref.referred_by;
  if (!referrer || typeof referrer === 'string') return null;
  return [referrer.lastName, referrer.firstName].filter(Boolean).join(' ').trim() || null;
}

export function assetName(ref: AssetRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  return ref.name ?? null;
}

export function assetLocation(ref: AssetRef | null | undefined): string | null {
  if (!ref || typeof ref === 'string') return null;
  return ref.asset_location ?? null;
}

/* -------------------- entity -------------------- */

/**
 * The fields this screen reads from the Transaction document.
 *
 * `user` and `source_asset` are populated as of 2026-08-13 (ticket 24a).
 *
 * Note what is **not** here: `description`. It survives on the BE but carries
 * no property — it is one of four fixed literals (`'AP: flex initial purchase'`
 * and friends), so reading it would print the same string on every row where
 * the property belongs. The asset name comes from `source_asset`, which is the
 * only honest route to it (⛔ ticket 24c).
 */
export const PurchaseSchema = z.looseObject({
  _id: z.string(),
  user: BuyerRefSchema,
  type: z.literal('purchase'),
  amount: z.number(),
  status: PurchaseStatusSchema,
  admin_status: z.string().nullable().optional(),
  payment_method: z.enum(PAYMENT_METHODS),
  source_asset: AssetRefSchema.nullable().optional(),
  number_of_units: z.number().nullable().optional(),
  purchase_details: PurchaseDetailsSchema.nullable().optional(),
  decline_reason: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;

export function purchaseKind(row: Purchase): string {
  return row.purchase_details?.transaction_kind ?? '';
}

/** Any full-ownership purchase row, including the outright document sibling. */
export function isFoPurchase(row: Purchase): boolean {
  return (FO_KINDS as readonly string[]).includes(purchaseKind(row));
}

/**
 * GET /admin/fo/purchase/transactions/:id — the transaction, plus the outright
 * document sibling when this is a land row (or the land parent when this is
 * the document row). The BE may return the tx at the root with `sibling`, or
 * wrap both as `{ transaction, sibling }`.
 */
function nestedPurchase(value: unknown): unknown {
  if (!value || typeof value !== 'object') return null;
  if ('_id' in value) return value;
  return null;
}

function normalizeFoDetail(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const record = raw as Record<string, unknown>;
  const nested = nestedPurchase(record.transaction);
  if (nested && !record._id) {
    return {
      ...(nested as Record<string, unknown>),
      sibling:
        nestedPurchase(record.sibling) ??
        nestedPurchase(record.outright_sibling) ??
        null,
    };
  }
  return raw;
}

export type FoTransactionDetail = Purchase & { sibling?: Purchase | null };

export const FoTransactionDetailSchema = z.looseObject({}).transform((raw) => {
  const parsed = PurchaseSchema.and(
    z.looseObject({ sibling: PurchaseSchema.nullable().optional() })
  ).parse(normalizeFoDetail(raw));
  return parsed as FoTransactionDetail;
});

/** Which admin review family this row belongs to, or null if none. */
export function purchaseReviewFamily(row: Purchase): PurchaseReviewFamily | null {
  const kind = purchaseKind(row);
  if ((FLEX_KINDS as readonly string[]).includes(kind)) return 'flex';
  if ((REVIEWABLE_FO_KINDS as readonly string[]).includes(kind)) return 'full-ownership';
  return null;
}

/**
 * Whether this row can be reviewed, mirroring the unified
 * `requirePendingTransfer`: a reviewable kind, paid by transfer, still pending.
 * Paystack confirms via webhook and wallet settles instantly, so neither has
 * an admin action. `fo_outright_doc` is never reviewable — approve the land row.
 */
export function isReviewablePurchase(row: Purchase): boolean {
  return (
    purchaseReviewFamily(row) !== null &&
    row.payment_method === 'transfer' &&
    row.admin_status === 'pending'
  );
}

/** Initial land/flex purchase — decline releases reserved units. */
export function isInitialPurchase(row: Purchase): boolean {
  const kind = purchaseKind(row);
  return (
    kind === 'initial_flex_purchase' ||
    kind === 'fo_outright_land' ||
    kind === 'fo_installment_land'
  );
}

/** Mirrors `DeclineFlexTransferDto` — min 20 chars, no upper bound. */
export const PURCHASE_DECLINE_REASON_MIN = 20;

export const purchaseDeclineReasonSchema = z
  .string()
  .trim()
  .min(PURCHASE_DECLINE_REASON_MIN, `Explain in at least ${PURCHASE_DECLINE_REASON_MIN} characters`);
