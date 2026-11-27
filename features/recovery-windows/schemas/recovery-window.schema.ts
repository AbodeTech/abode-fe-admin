import { z } from "zod";

/* ============================================================
 * Recovery windows — Finance › Recovery period.
 *
 * BE: abode-be-v2 src/modules/acquisition/recovery-window/
 *   GET  /admin/recovery-windows?tab=&search=&page=&limit=   (paged rows)
 *   GET  /admin/recovery-windows/stats
 *   GET  /admin/recovery-windows/:id                         (record)
 *   POST /admin/recovery-windows/:id/remind
 *   POST /admin/recovery-windows/:id/terms
 *   POST /admin/recovery-windows/:id/choice/decline
 *   POST /admin/recovery-windows/:id/refund/{adjust,hold,release,approve}
 *
 * One window per suspension: three months to move what was paid to another
 * product, then the plan ends (refund over 30% paid, paid to the bank as a refund payout).
 * ============================================================ */

export const RECOVERY_STAGES = [
  "open",
  "choice_sent",
  "terms_sent",
  "payment_pending",
  "moved",
  "refund_pending",
  "refund_on_hold",
  "ended_refund",
  "ended_no_refund",
  "cancelled",
] as const;
export const RecoveryStageSchema = z.enum(RECOVERY_STAGES);
export type RecoveryStage = z.infer<typeof RecoveryStageSchema>;

export const RECOVERY_TABS = [
  "window",
  "ending",
  "choices",
  "payment",
  "refund",
  "moved",
  "ended",
  "cancelled",
] as const;
export type RecoveryTab = (typeof RECOVERY_TABS)[number];

const OutcomeSchema = z.looseObject({
  kind: z.enum(["refund", "no_refund"]),
  no_refund_reason: z.string().nullable(),
  land_price: z.number(),
  land_paid: z.number(),
  share_paid_pct: z.number(),
  admin_charge: z.number(),
  default_fee_deducted: z.number(),
  default_fee_waived: z.number(),
  refund_amount: z.number(),
});
export type RecoveryOutcome = z.infer<typeof OutcomeSchema>;

export const RecoveryRowSchema = z.looseObject({
  id: z.string(),
  plan_id: z.string(),
  user_id: z.string(),
  stage: RecoveryStageSchema,
  plan_type: z.string(),
  customer_name: z.string().nullable(),
  customer_email: z.string().nullable(),
  customer_phone: z.string().nullable(),
  asset_name: z.string().nullable(),
  size_sqm: z.number().nullable(),
  unique_asset_id: z.string().nullable(),
  land_price: z.number(),
  land_paid: z.number(),
  share_paid_pct: z.number(),
  default_fee_owed: z.number(),
  suspended_at: z.string(),
  window_ends_at: z.string(),
  days_left: z.number(),
  expected: OutcomeSchema.nullable(),
  refund_amount: z.number().nullable(),
  refund_adjusted: z.boolean().default(false),
  hold_reason: z.string().nullable(),
  latest_choice: z
    .looseObject({
      asset_name: z.string().nullable(),
      asset_type: z.string(),
      size_sqm: z.number(),
      chosen_at: z.string(),
      outcome: z.string().nullable(),
    })
    .nullable()
    .default(null),
  latest_terms: z
    .looseObject({
      version: z.number(),
      status: z.string(),
      asset_name: z.string().nullable(),
      size_sqm: z.number(),
      due_now: z.number(),
      holds_until: z.string(),
      is_counter: z.boolean(),
    })
    .nullable()
    .default(null),
  new_plan_id: z.string().nullable().default(null),
  can_remind: z.boolean(),
  last_reminder: z.looseObject({ kind: z.string(), sent_at: z.string() }).nullable(),
  updated_at: z.string().nullable(),
});
export type RecoveryRow = z.infer<typeof RecoveryRowSchema>;

export const RecoveryStatsSchema = z.looseObject({
  tabs: z.looseObject({
    window: z.number(),
    ending: z.number(),
    choices: z.number(),
    payment: z.number(),
    refund: z.number(),
    moved: z.number(),
    ended: z.number(),
  }),
  in_window_paid: z.number(),
  refunds_to_approve: z.number(),
});
export type RecoveryStats = z.infer<typeof RecoveryStatsSchema>;

export const RecoveryChoiceSchema = z.looseObject({
  asset_id: z.string(),
  asset_type: z.string(),
  asset_name: z.string().nullable().optional(),
  size_sqm: z.number(),
  units: z.number().default(1),
  tenor_months: z.number().nullable().optional(),
  list_land_price: z.number().default(0),
  list_document_price: z.number().default(0),
  chosen_at: z.string(),
  outcome: z.string().nullable().optional(),
  decline_note: z.string().nullable().optional(),
});
export type RecoveryChoice = z.infer<typeof RecoveryChoiceSchema>;

export const RecoveryOfferSchema = z.looseObject({
  version: z.number(),
  sent_at: z.string(),
  sent_by: z.string().optional(),
  holds_until: z.string(),
  status: z.enum(["waiting", "payment_pending", "accepted", "replaced", "expired"]),
  is_counter: z.boolean(),
  asset_id: z.string(),
  asset_type: z.string(),
  asset_name: z.string().nullable().optional(),
  size_sqm: z.number(),
  units: z.number(),
  land_price: z.number(),
  tenor_months: z.number(),
  document_price: z.number(),
  document_tenor_months: z.number(),
  payment_type: z.string().nullable().optional(),
  land_carry: z.number(),
  document_carry: z.number(),
  upfront_land: z.number(),
  land_monthly: z.number(),
  document_monthly: z.number(),
  default_fee: z.number(),
  default_fee_waived: z.boolean(),
  change_fee: z.number(),
  change_fee_waived: z.boolean(),
  due_now: z.number(),
  internal_reason: z.string().optional(),
  customer_note: z.string().nullable().optional(),
  accepted_at: z.string().nullable().optional(),
});
export type RecoveryOffer = z.infer<typeof RecoveryOfferSchema>;

const EndingSchema = z.looseObject({
  ended_at: z.string(),
  land_price: z.number(),
  land_paid: z.number(),
  share_paid_pct: z.number(),
  admin_charge: z.number(),
  default_fee_deducted: z.number(),
  default_fee_waived: z.number(),
  refund_amount: z.number(),
  no_refund_reason: z.string().nullable().optional(),
  refund_final: z.number().nullable().optional(),
  adjust_reason: z.string().nullable().optional(),
  adjusted_at: z.string().nullable().optional(),
  hold_reason: z.string().nullable().optional(),
  held_at: z.string().nullable().optional(),
  approved_at: z.string().nullable().optional(),
  refund_transaction_id: z.string().nullable().optional(),
});
export type RecoveryEnding = z.infer<typeof EndingSchema>;

export const RecoveryDetailSchema = RecoveryRowSchema.extend({
  reminders: z.array(
    z.looseObject({ kind: z.string(), sent_at: z.string(), sent_by: z.string().nullable().optional() })
  ),
  snapshot: z.looseObject({
    land_price: z.number(),
    land_paid: z.number(),
    land_balance: z.number(),
    document_price: z.number(),
    document_paid: z.number(),
    default_fee_owed: z.number(),
  }),
  choices: z.array(RecoveryChoiceSchema).default([]),
  offers: z.array(RecoveryOfferSchema).default([]),
  move: z
    .looseObject({
      offer_version: z.number(),
      payment_transaction_id: z.string().nullable().optional(),
      new_plan_id: z.string(),
      carry_over: z.number(),
      moved_at: z.string(),
    })
    .nullable()
    .default(null),
  ending: EndingSchema.nullable(),
  cancel_reason: z.string().nullable(),
  plan: z
    .looseObject({
      id: z.string(),
      status: z.string(),
      closure_kind: z.string().nullable(),
      balance: z.number(),
      amount_paid: z.number(),
      default_fee: z.number(),
      default_fee_paid: z.number(),
      default_fee_waived: z.number(),
      default_fee_outstanding: z.number(),
      suspension_reason: z.string().nullable(),
    })
    .nullable(),
  /** Only on refunds approved before payouts existed (credited to the wallet). */
  refund_transaction: z
    .looseObject({ id: z.string(), amount: z.number(), status: z.string(), created_at: z.string().optional() })
    .nullable()
    .default(null),
  /** The approved refund, owed to the customer's bank: Transactions › Refunds. */
  refund_payout: z
    .looseObject({
      id: z.string(),
      amount: z.number(),
      status: z.enum(["pending", "processing", "retry_needed", "paid"]),
      method: z.enum(["paystack", "manual"]).nullable(),
      bank_name: z.string().nullable(),
      account_number: z.string().nullable(),
      account_name: z.string().nullable(),
      has_bank_details: z.boolean(),
      reference: z.string().nullable(),
      last_error: z.string().nullable(),
      sent_at: z.string().nullable(),
      paid_at: z.string().nullable(),
    })
    .nullable()
    .default(null),
  history: z.array(
    z.looseObject({
      action: z.string(),
      actor_type: z.string().optional(),
      admin_id: z.string().nullable(),
      reason: z.string().nullable(),
      metadata: z.record(z.string(), z.unknown()).nullable(),
      at: z.string(),
    })
  ),
});
export type RecoveryDetail = z.infer<typeof RecoveryDetailSchema>;

/* ---------- Write payloads (exactly the BE DTO fields) ---------- */

export type MoveProduct = "flex" | "full-ownership" | "commercial";

export type SendTermsPayload = {
  asset_id: string;
  asset_type: MoveProduct;
  size_sqm: number;
  units?: number;
  land_price: number;
  tenor_months: number;
  document_price?: number;
  document_tenor_months?: number;
  payment_type?: "all-inclusive" | "partially-inclusive";
  land_carry: number;
  document_carry?: number;
  upfront_land?: number;
  waive_default_fee?: boolean;
  change_fee?: number;
  waive_change_fee?: boolean;
  hold_days?: number;
  internal_reason: string;
  customer_note?: string;
  expected_updated_at?: string;
};

export const SendTermsResponseSchema = RecoveryOfferSchema.omit({ internal_reason: true, sent_by: true }).extend({
  land_left_to_pay: z.number(),
  document_left_to_pay: z.number(),
});

export const AckSchema = z.looseObject({});

/* ---------- Product pickers for Send terms ---------- */

/** GET /admin/assets — just enough to list estates that sell a product. */
export const RecoveryAssetOptionSchema = z.looseObject({
  _id: z.string(),
  name: z.string(),
  offers: z
    .array(z.looseObject({ offer_type: z.string(), is_active: z.boolean().default(true) }))
    .default([]),
});
export type RecoveryAssetOption = z.infer<typeof RecoveryAssetOptionSchema>;

/** GET /admin/assets/:id — the offer → size → plan tree, for sizes and list prices. */
export const RecoveryAssetTreeSchema = z.looseObject({
  _id: z.string(),
  name: z.string(),
  offers: z
    .array(
      z.looseObject({
        offer_type: z.string(),
        is_active: z.boolean().default(true),
        payment_type: z.string().optional(),
        sizes: z
          .array(
            z.looseObject({
              size_sqm: z.number(),
              is_active: z.boolean().default(true),
              units_available: z.number().optional(),
              document_fee: z.number().optional(),
              plans: z
                .array(
                  z.looseObject({
                    tenor_months: z.number(),
                    land_price: z.number(),
                    is_active: z.boolean().optional(),
                  })
                )
                .default([]),
            })
          )
          .default([]),
      })
    )
    .default([]),
});
export type RecoveryAssetTree = z.infer<typeof RecoveryAssetTreeSchema>;
