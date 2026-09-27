import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * GET /admin/assets/:assetId/sqm-inventory/reconciliation and
 * POST .../sqm-inventory/activate — confirmed directly from
 * `SqmActivationService.reconcile()`/`activate()` on staging. This is the
 * REAL readiness/activation check for the sqm ledger — unrelated to
 * `inventory-reconciliation.schema.ts`'s by-size physical/commercial demo
 * panel, which has no backend behind it at all.
 * ============================================================ */

export const SqmReconciliationPlanRowSchema = z.object({
  payment_plan_id: z.string(),
  plan_type: z.string(),
  offer_type: OfferTypeSchema.nullable(),
  size_id: z.string().nullable(),
  size_sqm: z.number(),
  units: z.number(),
  sqm: z.number(),
  blocker: z.string().nullable(),
});

export const SqmReconciliationByProductSchema = z.object({
  offer_type: OfferTypeSchema,
  assigned_sqm: z.number(),
  committed_sqm: z.number(),
  over_by_sqm: z.number(),
});

export const SqmReconciliationSchema = z.object({
  asset_id: z.string(),
  asset_name: z.string(),
  inventory_model_version: z.string(),
  ready: z.boolean(),
  blockers: z.array(z.string()).default([]),
  totals: z.object({
    live_plans: z.number(),
    mapped_plans: z.number(),
    committed_sqm: z.number(),
  }),
  by_product: z.array(SqmReconciliationByProductSchema).default([]),
  plans: z.array(SqmReconciliationPlanRowSchema).default([]),
});

export type SqmReconciliation = z.infer<typeof SqmReconciliationSchema>;

/**
 * POST .../sqm-inventory/activate. Idempotent — activating an
 * already-active estate returns `{activated:false, already_active:true}`
 * with a fresh report rather than an error. Blocked (400
 * `LAND_CONFIGURATION_INCOMPLETE`) unless `ready:true`.
 */
export const SqmActivationResultSchema = z.object({
  activated: z.boolean(),
  already_active: z.boolean(),
  report: SqmReconciliationSchema,
});

export type SqmActivationResult = z.infer<typeof SqmActivationResultSchema>;
