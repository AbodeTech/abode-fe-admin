import { z } from 'zod';

/* ============================================================
 * Asset transactions — purchase rows from GET /admin/transactions.
 *
 * v2 keeps ONE stream: every asset purchase is a wallet Transaction with
 * `type: 'purchase'`, flex or (eventually) full-ownership alike. The kind
 * lives in `purchase_details.transaction_kind` — a property of the row, not
 * a mode of the page, exactly like offer types on the assets table.
 *
 * Review exists per family: transfer-paid flex purchases pending approval go
 * through POST /admin/acquisitions/flex/:txId/approve|decline. Approve is a
 * heavy action — it creates the payment plan AND pays commission.
 *
 * ⛔ Full-ownership purchases have NO backend flow yet (no initiate, no
 * submit, no review) — rows of that kind cannot exist today. See
 * docs/BACKEND-REQUESTS.md.
 *
 * Amounts are decimal naira.
 * ============================================================ */

export const FLEX_KINDS = ['initial_flex_purchase', 'recurring_flex_payment'] as const;

/** Open vocabulary on the wire — new kinds must not break the table. */
export const KIND_LABELS: Record<string, string> = {
  initial_flex_purchase: 'New purchase · Flex',
  recurring_flex_payment: 'Installment · Flex',
};

export function kindLabel(kind: string | null | undefined): string {
  if (!kind) return '—';
  return KIND_LABELS[kind] ?? kind.replace(/_/g, ' ');
}

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

/**
 * The fields this screen reads from the Transaction document.
 *
 * ⛔ ticket 13 family — `user` and `source_asset` are bare ObjectIds (no
 * populate on GET /admin/transactions), so buyer and asset render as the
 * em-dash + copyable-id pattern.
 */
export const PurchaseSchema = z.looseObject({
  _id: z.string(),
  user: z.string(),
  type: z.literal('purchase'),
  amount: z.number(),
  status: PurchaseStatusSchema,
  admin_status: z.string().nullable().optional(),
  payment_method: z.enum(PAYMENT_METHODS),
  source_asset: z.string().nullable().optional(),
  number_of_units: z.number().nullable().optional(),
  purchase_details: PurchaseDetailsSchema.nullable().optional(),
  decline_reason: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;

/**
 * Whether this row can be reviewed, mirroring `requirePendingTransfer`'s
 * guards exactly: a flex kind, paid by transfer, still pending. Anything
 * else — Paystack rows confirm via webhook, wallet rows settle instantly —
 * has no admin action, and a non-flex kind has no endpoint family yet.
 */
export function isReviewablePurchase(row: Purchase): boolean {
  const kind = row.purchase_details?.transaction_kind ?? '';
  return (
    (FLEX_KINDS as readonly string[]).includes(kind) &&
    row.payment_method === 'transfer' &&
    row.admin_status === 'pending'
  );
}

/** Mirrors `DeclineFlexTransferDto` — min 20 chars, no upper bound. */
export const PURCHASE_DECLINE_REASON_MIN = 20;

export const purchaseDeclineReasonSchema = z
  .string()
  .trim()
  .min(PURCHASE_DECLINE_REASON_MIN, `Explain in at least ${PURCHASE_DECLINE_REASON_MIN} characters`);
