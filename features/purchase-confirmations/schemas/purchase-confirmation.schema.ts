import { z } from 'zod';

/* ============================================================
 * Purchase Confirmations — admin list/counts/export + resolve-dispute/
 * resend, GET/POST /admin/purchase-confirmations/*.
 *
 * Buyers get an email after a confirmed purchase asking them to review and
 * confirm the details that go on their property documents. This is the
 * admin view of that loop: who confirmed, who is still waiting, who
 * reported a problem.
 *
 * Landed on abode-be-v2 staging via PR #46 (purchase-confirmation-admin
 * .controller.ts) — shapes are transcribed from `admin-purchase-
 * confirmation.dto.ts` and `buyer-purchase-confirmation.dto.ts` directly.
 * Not live-verified: the Railway deployment is down as of this port
 * ("Application not found" on every route, not a real app 404) — re-verify
 * once it's back.
 * ============================================================ */

export const PURCHASE_CONFIRMATION_STATUSES = ['waiting', 'disputed', 'confirmed'] as const;
export const PurchaseConfirmationStatusSchema = z.enum(PURCHASE_CONFIRMATION_STATUSES);
export type PurchaseConfirmationStatus = z.infer<typeof PurchaseConfirmationStatusSchema>;

export const PURCHASE_CONFIRMATION_PRODUCTS = ['flex', 'full-ownership'] as const;
export const PurchaseConfirmationProductSchema = z.enum(PURCHASE_CONFIRMATION_PRODUCTS);
export type PurchaseConfirmationProduct = z.infer<typeof PurchaseConfirmationProductSchema>;

const AdminBuyerSchema = z
  .object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone_number: z.string().nullable(),
  })
  .nullable();

const PurchaseSnapshotSchema = z.object({
  name_on_document: z.string(),
  size: z.number(),
  units: z.number(),
  plan_label: z.string(),
  land_amount: z.number(),
  development_levy: z.number(),
  total: z.number(),
  product: z.string(),
});

const PurchaseDisputeSchema = z.object({
  note: z.string(),
  disputed_at: z.string(),
  resolved_at: z.string().nullable(),
  resolution_note: z.string().nullable(),
  snapshot_at_dispute: PurchaseSnapshotSchema.nullable(),
});

/** GET /admin/purchase-confirmations — one row, matching AdminConfirmationRowDto. */
export const AdminConfirmationRowSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  unique_asset_id: z.string(),
  status: PurchaseConfirmationStatusSchema,
  buyer: AdminBuyerSchema,
  referrer: z.string().nullable(),
  asset: z.string().nullable(),
  snapshot: PurchaseSnapshotSchema,
  email_sent_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  reminders_sent: z.array(z.string()),
  escalated_at: z.string().nullable(),
  open_dispute_note: z.string().nullable(),
  disputes: z.array(PurchaseDisputeSchema),
  createdAt: z.string(),
});

export type AdminConfirmationRow = z.infer<typeof AdminConfirmationRowSchema>;

/** GET /admin/purchase-confirmations/counts */
export const ConfirmationCountsSchema = z.object({
  waiting: z.number(),
  disputed: z.number(),
  confirmed: z.number(),
});

/** POST /admin/purchase-confirmations/:plan_id/resolve-dispute — never confirms. */
export const ResolveDisputeResponseSchema = z.object({
  plan_id: z.string(),
  status: PurchaseConfirmationStatusSchema,
  resent: z.boolean(),
});

/** POST /admin/purchase-confirmations/:plan_id/resend */
export const ResendResponseSchema = z.object({
  plan_id: z.string(),
  resent: z.boolean(),
  message: z.string(),
});
