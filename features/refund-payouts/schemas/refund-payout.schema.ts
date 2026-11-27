import { z } from "zod";

/* ============================================================
 * Transactions › Refunds — GET/POST /admin/refund-payouts (abode-be-v2
 * refund-payout.service.ts, feat/plan-recovery).
 *
 * An approved recovery refund, owed to the customer's bank. It never goes into
 * the wallet, so finance can follow each naira from plan to bank transfer.
 *
 *   pending       approved on the recovery record; waiting to be sent
 *   processing    with Paystack; the webhook (or the 30-minute sweep) settles it
 *   retry_needed  Paystack didn't take it, or it failed / was reversed. Still owed
 *   paid          in the customer's bank (sent by Paystack, or paid by hand)
 * ============================================================ */

export const REFUND_PAYOUT_STATUSES = ["pending", "processing", "retry_needed", "paid"] as const;
export type RefundPayoutStatus = (typeof REFUND_PAYOUT_STATUSES)[number];

export const REFUND_PAYOUT_STATUS_LABELS: Record<RefundPayoutStatus, string> = {
  pending: "To send",
  processing: "With Paystack",
  retry_needed: "Needs retry",
  paid: "Paid",
};

export const RefundPayoutSchema = z.looseObject({
  id: z.string(),
  recovery_window_id: z.string(),
  user_id: z.string(),
  plan_id: z.string(),
  plan_type: z.string(),
  customer_name: z.string().nullable(),
  customer_email: z.string().nullable(),
  asset_name: z.string().nullable(),
  size_sqm: z.number().nullable(),
  ended_early: z.boolean(),
  amount: z.number(),
  status: z.enum(REFUND_PAYOUT_STATUSES),
  method: z.enum(["paystack", "manual"]).nullable(),
  /** Once sent, the account it went to; before that, where it will go. Null: none saved. */
  bank: z
    .looseObject({
      bank_name: z.string(),
      account_number: z.string(),
      account_name: z.string(),
    })
    .nullable(),
  reference: z.string().nullable(),
  provider_transfer_reference: z.string().nullable(),
  manual_reference: z.string().nullable(),
  manual_note: z.string().nullable(),
  last_error: z.string().nullable(),
  attempts: z
    .array(
      z.looseObject({
        reference: z.string(),
        outcome: z.string(),
        error_message: z.string().nullable(),
        at: z.string(),
      })
    )
    .default([]),
  approved_at: z.string(),
  sent_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
});
export type RefundPayout = z.infer<typeof RefundPayoutSchema>;

const Bucket = z.object({ count: z.number(), amount: z.number() });
export const RefundPayoutStatsSchema = z.looseObject({
  owed: Bucket,
  pending: Bucket,
  processing: Bucket,
  retry_needed: Bucket,
  paid: Bucket,
});
export type RefundPayoutStats = z.infer<typeof RefundPayoutStatsSchema>;

/** What each row allows. Paid by hand only when it isn't with Paystack. */
export function refundPayoutActions(row: RefundPayout) {
  return {
    canSend: row.status === "pending" && !!row.bank,
    canRetry: row.status === "retry_needed" && !!row.bank,
    canMarkPaid: row.status === "pending" || row.status === "retry_needed",
  };
}
