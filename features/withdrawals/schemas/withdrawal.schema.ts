import { z } from 'zod';

/* ============================================================
 * Withdrawal queue — GET /admin/withdrawals and the three actions.
 *
 * A queue row is a wallet `Transaction` document with `type: 'withdrawal'`.
 * Two status fields coexist and mean different things:
 *
 *   `admin_status` — the REVIEW state. pending → approved / declined, with
 *                    `approved-retry-needed` when the payment rail refused
 *                    the transfer and `auto-approved` when no human was
 *                    involved. This is what the queue is worked by.
 *   `status`       — the MONEY state. pending → processing → completed /
 *                    failed / cancelled. Approval moves it to `processing`;
 *                    `completed` arrives later via the provider webhook.
 *
 * ⛔ ticket 13 — `user`, `bank_details_id` and `reviewed_by` are bare
 * ObjectIds (no populate on this endpoint), so the queue cannot show who is
 * withdrawing or which account the money goes to. Rendered as the em-dash +
 * copyable-id pattern until the backend populates.
 *
 * Amounts are decimal naira.
 * ============================================================ */

export const ADMIN_STATUSES = [
  'pending',
  'auto-approved',
  'approved',
  'approved-retry-needed',
  'declined',
  'failed',
] as const;
export const AdminStatusSchema = z.enum(ADMIN_STATUSES);
export type AdminStatus = z.infer<typeof AdminStatusSchema>;

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  pending: 'Pending review',
  'auto-approved': 'Auto-approved',
  approved: 'Approved',
  'approved-retry-needed': 'Retry needed',
  declined: 'Declined',
  failed: 'Failed',
};

export const TRANSACTION_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
] as const;
export const TransactionStatusSchema = z.enum(TRANSACTION_STATUSES);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Paid out',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const PAYMENT_PROVIDERS = ['paystack', 'paga'] as const;
export const PaymentProviderSchema = z.enum(PAYMENT_PROVIDERS);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  paystack: 'Paystack',
  paga: 'Paga',
};

/** One failed attempt at a payment rail — why "Retry needed" is on the row. */
export const RailAttemptSchema = z.object({
  provider: PaymentProviderSchema,
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
  }),
  attempted_at: z.string(),
});

export type RailAttempt = z.infer<typeof RailAttemptSchema>;

/**
 * The fields this screen reads, from the much larger Transaction document.
 * `z.looseObject` — the document carries commission/purchase fields this
 * screen never touches, and new ones appearing must not break the queue.
 */
export const WithdrawalSchema = z.looseObject({
  _id: z.string(),
  user: z.string(),
  type: z.literal('withdrawal'),
  direction: z.string().optional(),

  amount: z.number(),
  fee_amount: z.number().nullable().optional(),
  total_debited: z.number().nullable().optional(),
  net_amount: z.number().nullable().optional(),

  status: TransactionStatusSchema,
  admin_status: AdminStatusSchema.nullable().optional(),

  payment_provider: PaymentProviderSchema.nullable().optional(),
  provider_transfer_reference: z.string().nullable().optional(),
  rail_attempts: z.array(RailAttemptSchema).default([]),

  bank_details_id: z.string().nullable().optional(),
  withdrawal_reason: z.string().nullable().optional(),

  decline_reason: z.string().nullable().optional(),
  reviewed_by: z.string().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  processing_type: z.enum(['auto', 'manual']).nullable().optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Withdrawal = z.infer<typeof WithdrawalSchema>;

/**
 * What the actions are allowed to do, derived from the same states the
 * backend guards on — so a refused click never reaches the network.
 *
 *   approve  — pending only (a bound transaction refuses server-side too)
 *   decline  — pending or approved-retry-needed, and never once a provider
 *              reference exists (`TRANSACTION_ALREADY_BOUND`)
 *   retry    — approved-retry-needed only (`INVALID_STATE_FOR_RETRY`)
 */
export function withdrawalActions(row: Withdrawal): {
  canApprove: boolean;
  canDecline: boolean;
  canRetry: boolean;
} {
  const bound = Boolean(row.provider_transfer_reference);
  const adminStatus = row.admin_status ?? 'pending';

  return {
    canApprove: adminStatus === 'pending' && !bound,
    canDecline: (adminStatus === 'pending' || adminStatus === 'approved-retry-needed') && !bound,
    canRetry: adminStatus === 'approved-retry-needed' && !bound,
  };
}

/** Mirrors `DeclineWithdrawalDto` / `RetryWithdrawalDto` — 20–500 chars. */
export const WITHDRAWAL_REASON_MIN = 20;
export const WITHDRAWAL_REASON_MAX = 500;

export const withdrawalReasonSchema = z
  .string()
  .trim()
  .min(WITHDRAWAL_REASON_MIN, `Explain in at least ${WITHDRAWAL_REASON_MIN} characters`)
  .max(WITHDRAWAL_REASON_MAX, `Keep it under ${WITHDRAWAL_REASON_MAX} characters`);
