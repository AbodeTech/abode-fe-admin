import { z } from 'zod';

import { PURCHASE_DECLINE_REASON_MIN } from './purchase.schema';

/* ============================================================
 * Full-ownership land payment plan — GET /admin/fo/purchase/payment-plans/:id
 * plus suspend / unsuspend / allocate.
 *
 * Suspend reuses the decline DTO: `{ reason }` min 20 chars.
 * Allocate is `{ block, plot }` — both required strings, one pair.
 * ============================================================ */

export const FO_PLAN_SUSPEND_REASON_MIN = PURCHASE_DECLINE_REASON_MIN;

export const foPlanSuspendReasonSchema = z
  .string()
  .trim()
  .min(
    FO_PLAN_SUSPEND_REASON_MIN,
    `Explain in at least ${FO_PLAN_SUSPEND_REASON_MIN} characters`
  );

export const allocateFoPlanSchema = z.object({
  block: z.string().trim().min(1, 'Block is required'),
  plot: z.string().trim().min(1, 'Plot is required'),
});

export type AllocateFoPlanInput = z.infer<typeof allocateFoPlanSchema>;

const nestedPlan = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record._id === 'string' ? record : null;
};

/**
 * Detail may arrive as the plan at the root, or wrapped
 * `{ plan, document_plan }` / `{ payment_plan, linked_document_plan }`.
 */
function normalizeFoPlan(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const record = raw as Record<string, unknown>;
  const wrapped =
    nestedPlan(record.plan) ?? nestedPlan(record.payment_plan) ?? nestedPlan(record.land_plan);
  if (wrapped && typeof record._id !== 'string') {
    return {
      ...wrapped,
      document_plan:
        record.document_plan ??
        record.linked_document_plan ??
        wrapped.document_plan ??
        null,
    };
  }
  return raw;
}

const stringish = z.union([z.string(), z.number()]).transform((value) => String(value));

export const FoLandPlanSchema = z.looseObject({
  _id: z.string(),
  is_suspended: z.boolean().optional(),
  block: stringish.nullable().optional(),
  plot: stringish.nullable().optional(),
  allocation_status: z.string().nullable().optional(),
  allocation_date: z.string().nullable().optional(),
  default_count: z.number().optional(),
  unique_asset_id: z.string().nullable().optional(),
  asset_type: z.string().optional(),
  amount_paid: z.number().optional(),
  amount_payable: z.number().optional(),
  balance: z.number().optional(),
  size: z.number().optional(),
  document_plan: z.looseObject({ _id: z.string() }).nullable().optional(),
});

export type FoLandPlan = z.infer<typeof FoLandPlanSchema>;

export const FoLandPlanDetailSchema = z.looseObject({}).transform((raw) => {
  return FoLandPlanSchema.parse(normalizeFoPlan(raw));
});

export const FoPlanActionResultSchema = z.looseObject({
  message: z.string().optional(),
  _id: z.string().optional(),
});
