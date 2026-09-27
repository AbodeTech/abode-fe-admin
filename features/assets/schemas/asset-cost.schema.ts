import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * Asset costs — the real abode-be-v2 model (confirmed field-for-field
 * against `src/modules/asset-cost/*` on staging, PR #82 "phase-1"). This is
 * NOT the flat "one record, five stage snapshots" shape this file used to
 * model before that PR existed — it is three separate resources:
 *
 *   AssetCostItem       — the catalogue line ("Perimeter fencing", group
 *                          acquisition/development/..., whether it's shared
 *                          across products, and its allocation basis).
 *   AssetCostObligation — one thing being paid for against a cost item
 *                          ("this Q1's fencing contract"), optionally tied
 *                          to one product/size, sourced manually or from a
 *                          field submission / commission transaction / work
 *                          order.
 *   AssetCostEvent       — one financial-stage row on an obligation
 *                          (budget → committed → claimed → incurred → paid,
 *                          or a reversal/adjustment). Only an APPROVED
 *                          incurred/reversal/adjustment event counts toward
 *                          profitability — everything else is planning data.
 *
 * A shared cost item's allocation rule (`AllocationRule` below) is its own
 * versioned sub-resource, dated and reasoned like `land-configuration`'s
 * PUT — but per COST ITEM, not one estate-wide singleton (the old
 * `profitability-basis.schema.ts` concept, now deleted: it doesn't exist on
 * the real backend at all).
 * ============================================================ */

export const COST_GROUPS = ['acquisition', 'development', 'documentation_finance', 'direct_cost_of_sale', 'opex'] as const;
export const CostGroupSchema = z.enum(COST_GROUPS);
export type CostGroup = z.infer<typeof CostGroupSchema>;

export const COST_GROUP_LABELS: Record<CostGroup, string> = {
  acquisition: 'Acquisition',
  development: 'Development',
  documentation_finance: 'Documentation & Finance',
  direct_cost_of_sale: 'Direct Cost of Sale',
  opex: 'OPEX',
};

/** Items are free text — the backend has no closed item-name list, only the five groups above. */
export const COST_ITEM_SUGGESTIONS: Record<CostGroup, string[]> = {
  acquisition: ['Land purchase', 'Acquisition legal fees', 'Agency commission'],
  development: ['Perimeter fencing', 'Road construction', 'Drainage', 'Electrification'],
  documentation_finance: ['Survey and legal fees', 'C of O application', 'Registered survey'],
  direct_cost_of_sale: ['Sales commission accrual', 'Marketing spend'],
  opex: ['Site security', 'Site management', 'Maintenance'],
};

export const ALLOCATION_BASES = [
  'total_sqm',
  'saleable_sqm',
  'product_sqm',
  'sqm_sold',
  'revenue',
  'units',
  'equal',
  'manual',
  'amount',
  'direct',
] as const;
export const AllocationBasisSchema = z.enum(ALLOCATION_BASES);
export type AllocationBasis = z.infer<typeof AllocationBasisSchema>;

export const ALLOCATION_BASIS_LABELS: Record<AllocationBasis, string> = {
  total_sqm: 'By total sqm',
  saleable_sqm: 'By saleable sqm',
  product_sqm: 'By product sqm',
  sqm_sold: 'By sqm sold',
  revenue: 'By revenue',
  units: 'By units',
  equal: 'Equally',
  manual: 'Manual percentages',
  amount: 'Manual amounts',
  direct: 'Direct (one product)',
};

export const FINANCIAL_STAGES = ['budget', 'committed', 'claimed', 'incurred', 'paid', 'reversal', 'adjustment'] as const;
export const FinancialStageSchema = z.enum(FINANCIAL_STAGES);
export type FinancialStage = z.infer<typeof FinancialStageSchema>;

export const FINANCIAL_STAGE_LABELS: Record<FinancialStage, string> = {
  budget: 'Budget',
  committed: 'Committed',
  claimed: 'Claimed',
  incurred: 'Incurred',
  paid: 'Paid',
  reversal: 'Reversal',
  adjustment: 'Adjustment',
};

/** Only these, once APPROVED, count toward profitability — everything else is planning data. */
export const RECOGNISED_STAGES: readonly FinancialStage[] = ['incurred', 'reversal', 'adjustment'];
export function countsAsCost(stage: FinancialStage): boolean {
  return RECOGNISED_STAGES.includes(stage);
}

export const OBLIGATION_STATUSES = ['open', 'settled', 'reversed', 'archived'] as const;
export const ObligationStatusSchema = z.enum(OBLIGATION_STATUSES);
export type ObligationStatus = z.infer<typeof ObligationStatusSchema>;

export const COST_EVENT_STATUSES = ['draft', 'approved', 'reversed', 'archived'] as const;
export const CostEventStatusSchema = z.enum(COST_EVENT_STATUSES);
export type CostEventStatus = z.infer<typeof CostEventStatusSchema>;

/**
 * A field submission, not a "site manager/surveyor submission" (the old
 * mock-invented source types) — that field-ops domain is owned by another
 * team now; this codebase only ever sees the resulting obligation/event.
 */
export const COST_SOURCE_TYPES = ['manual', 'field_submission', 'commission_transaction', 'work_order'] as const;
export const CostSourceTypeSchema = z.enum(COST_SOURCE_TYPES);
export type CostSourceType = z.infer<typeof CostSourceTypeSchema>;

export const COST_SOURCE_TYPE_LABELS: Record<CostSourceType, string> = {
  manual: 'Manual entry',
  field_submission: 'Field submission',
  commission_transaction: 'Commission transaction',
  work_order: 'Work order',
};

export const EvidenceItemSchema = z.object({
  url: z.string(),
  caption: z.string().nullable(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

const evidenceFormItemSchema = z.object({
  url: z.string().trim().min(1, 'Enter a URL'),
  caption: z.string().trim().max(200).optional(),
});

/* -------------------- cost item (catalogue) -------------------- */

export const ManualShareSchema = z.object({
  offer_type: OfferTypeSchema,
  percent: z.number(),
});
export type ManualShare = z.infer<typeof ManualShareSchema>;

/** GET/POST/PATCH .../costs/items — the catalogue line, as presented by `cost.presenter.ts`. */
export const AssetCostItemSchema = z.object({
  id: z.string(),
  asset_id: z.string(),
  group: CostGroupSchema,
  group_label: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  is_shared: z.boolean(),
  allocation_basis: AllocationBasisSchema.nullable(),
  allocation_label: z.string().nullable(),
  applies_to_products: z.array(OfferTypeSchema).default([]),
  excluded_products: z.array(OfferTypeSchema).default([]),
  manual_shares: z.array(ManualShareSchema).default([]),
  applicability_version: z.number().default(1),
  is_active: z.boolean(),
  /** True when `is_shared` but no allocation rule has been set yet. */
  needs_allocation_rule: z.boolean(),
  created_at: z.string().nullable(),
});
export type AssetCostItem = z.infer<typeof AssetCostItemSchema>;

export const createCostItemFormSchema = z.object({
  group: CostGroupSchema,
  name: z.string().trim().min(1, 'Name this cost item').max(120),
  description: z.string().trim().max(500).optional(),
  is_shared: z.boolean().default(false),
  applies_to_products: z.array(OfferTypeSchema).default([]),
  excluded_products: z.array(OfferTypeSchema).default([]),
});
export type CreateCostItemFormValues = z.input<typeof createCostItemFormSchema>;
export type CreateCostItemFormOutput = z.output<typeof createCostItemFormSchema>;

export const updateCostItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Name this cost item').max(120).optional(),
  description: z.string().trim().max(500).optional(),
  is_shared: z.boolean().optional(),
  applies_to_products: z.array(OfferTypeSchema).optional(),
  excluded_products: z.array(OfferTypeSchema).optional(),
  is_active: z.boolean().optional(),
});
export type UpdateCostItemFormValues = z.input<typeof updateCostItemFormSchema>;

/* -------------------- allocation rule (per item, versioned) -------------------- */

export const AllocationRuleShareSchema = z.object({
  offer_type: OfferTypeSchema,
  percent: z.number().nullable(),
  amount: z.number().nullable(),
});
export type AllocationRuleShare = z.infer<typeof AllocationRuleShareSchema>;

/**
 * One entry of `GET .../items/:itemId/allocation-rule`'s `rules[]` — every
 * version this cost item has ever had. Confirmed against the real
 * `allocationHistory()`'s inline return literal (there is no DTO/class for
 * this response anywhere on the backend): no `id` of its own (a rule's
 * identity is its `version`, not a Mongo id), no `asset_id`/`cost_item_id`
 * (redundant with the request's own `:itemId`), no `configured_by_email`
 * (folded into `configured_by`, which is already the email when one exists),
 * no `prior_version_id`. An earlier version of this schema required several
 * fields this response has never actually sent, which meant every real
 * request 200'd while failing schema validation — the allocation dialog
 * looked permanently stuck loading rather than erroring visibly.
 */
export const AllocationRuleSchema = z.object({
  version: z.number(),
  method: AllocationBasisSchema,
  applies_to_products: z.array(OfferTypeSchema).default([]),
  excluded_products: z.array(OfferTypeSchema).default([]),
  shares: z.array(AllocationRuleShareSchema).default([]),
  effective_date: z.string(),
  is_current: z.boolean(),
  reason: z.string(),
  configured_by: z.string(),
  configured_at: z.string().nullable(),
});
export type AllocationRule = z.infer<typeof AllocationRuleSchema>;

/**
 * The actual `GET .../items/:itemId/allocation-rule` response — the array is
 * keyed `rules`, not `items`, and it's nested one level under `cost_item`
 * (the item this history belongs to, `presentItem(...)`-shaped).
 */
export const AllocationRuleHistorySchema = z.object({
  cost_item: AssetCostItemSchema,
  rules: z.array(AllocationRuleSchema).default([]),
});
export type AllocationRuleHistory = z.infer<typeof AllocationRuleHistorySchema>;

/**
 * `PUT .../items/:itemId/allocation-rule`'s own response — narrower than a
 * `rules[]` entry above: no `is_current`, no `configured_by`/`configured_at`.
 * Confirmed against `setAllocationRule()`'s inline return literal. Refetch
 * the history (`AllocationRuleHistorySchema`) after saving rather than
 * trying to read those fields off the mutation result.
 */
export const SetAllocationRuleResultSchema = z.object({
  version: z.number(),
  method: AllocationBasisSchema,
  applies_to_products: z.array(OfferTypeSchema).default([]),
  excluded_products: z.array(OfferTypeSchema).default([]),
  shares: z.array(AllocationRuleShareSchema).default([]),
  effective_date: z.string(),
  reason: z.string(),
});
export type SetAllocationRuleResult = z.infer<typeof SetAllocationRuleResultSchema>;

/**
 * PUT .../items/:itemId/allocation-rule. `percentages` is required (and
 * must be provided) when `method === 'manual'`; `amounts` when
 * `method === 'amount'` — enforced here so the form can't submit a manual
 * rule with nothing to allocate, matching the real backend's own
 * `COST_ALLOCATION_INVALID` guard.
 */
export const setAllocationRuleFormSchema = z
  .object({
    method: AllocationBasisSchema,
    applies_to_products: z.array(OfferTypeSchema).default([]),
    excluded_products: z.array(OfferTypeSchema).default([]),
    percentages: z.array(z.object({ offer_type: OfferTypeSchema, percent: z.number() })).default([]),
    amounts: z.array(z.object({ offer_type: OfferTypeSchema, amount: z.number() })).default([]),
    effective_date: z.string().trim().min(1, 'Enter an effective date'),
    reason: z.string().trim().min(1, 'Say why this is changing'),
  })
  .refine((v) => v.method !== 'manual' || v.percentages.length > 0, {
    message: 'Add at least one product percentage',
    path: ['percentages'],
  })
  .refine((v) => v.method !== 'amount' || v.amounts.length > 0, {
    message: 'Add at least one product amount',
    path: ['amounts'],
  });
export type SetAllocationRuleFormValues = z.input<typeof setAllocationRuleFormSchema>;
export type SetAllocationRuleFormOutput = z.output<typeof setAllocationRuleFormSchema>;

/* -------------------- obligation (a cost record) -------------------- */

export const AssetCostObligationSchema = z.object({
  id: z.string(),
  asset_id: z.string(),
  cost_item: z.object({
    id: z.string(),
    name: z.string().nullable(),
    group: CostGroupSchema.nullable(),
    is_shared: z.boolean(),
    allocation_basis: AllocationBasisSchema.nullable(),
  }),
  title: z.string(),
  description: z.string().nullable(),
  product: OfferTypeSchema.nullable(),
  size_id: z.string().nullable(),
  vendor: z.string().nullable(),
  reference: z.string().nullable(),
  status: ObligationStatusSchema,
  source_type: CostSourceTypeSchema,
  source_id: z.string().nullable(),
  effective_date: z.string().nullable(),
  archived_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type AssetCostObligation = z.infer<typeof AssetCostObligationSchema>;

export const createObligationFormSchema = z.object({
  cost_item_id: z.string().min(1, 'Choose a cost item'),
  title: z.string().trim().min(1, 'Give this a title').max(160),
  description: z.string().trim().max(500).optional(),
  product: OfferTypeSchema.optional(),
  size_id: z.string().optional(),
  vendor: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
  effective_date: z.string().trim().min(1, 'Enter an effective date'),
  /** Omit entirely when unknown — never defaults to 0, a known-zero and an unknown amount mean different things. */
  amount: z.number().int('Whole naira only').min(0, 'Cannot be negative').optional(),
  stage: FinancialStageSchema.default('budget'),
  note: z.string().trim().max(500).optional(),
});
export type CreateObligationFormValues = z.input<typeof createObligationFormSchema>;
export type CreateObligationFormOutput = z.output<typeof createObligationFormSchema>;

export const archiveObligationFormSchema = z.object({
  reason: z.string().trim().min(1, 'Say why this is being archived').max(500),
});
export type ArchiveObligationFormValues = z.infer<typeof archiveObligationFormSchema>;

/* -------------------- event (one financial-stage row) -------------------- */

export const AssetCostEventSchema = z.object({
  id: z.string(),
  obligation_id: z.string(),
  cost_item_id: z.string(),
  financial_stage: FinancialStageSchema,
  stage_label: z.string(),
  counts_as_cost: z.boolean(),
  amount: z.number().nullable(),
  effective_date: z.string().nullable(),
  vendor: z.string().nullable(),
  reference: z.string().nullable(),
  note: z.string().nullable(),
  evidence: z.array(EvidenceItemSchema).default([]),
  status: CostEventStatusSchema,
  source_type: CostSourceTypeSchema,
  source_id: z.string().nullable(),
  revision: z.number().default(1),
  reverses_event_id: z.string().nullable(),
  reversal_reason: z.string().nullable(),
  approved_at: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type AssetCostEvent = z.infer<typeof AssetCostEventSchema>;

export const addStageFormSchema = z.object({
  stage: FinancialStageSchema,
  amount: z.number({ message: 'Enter an amount' }).int('Whole naira only').min(0, 'Cannot be negative'),
  effective_date: z.string().trim().optional(),
  vendor: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  evidence: z.array(evidenceFormItemSchema).default([]),
});
export type AddStageFormValues = z.input<typeof addStageFormSchema>;
export type AddStageFormOutput = z.output<typeof addStageFormSchema>;

export const updateEventFormSchema = z.object({
  amount: z.number().int('Whole naira only').min(0).optional(),
  effective_date: z.string().trim().optional(),
  vendor: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});
export type UpdateEventFormValues = z.input<typeof updateEventFormSchema>;

export const approveEventFormSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
export type ApproveEventFormValues = z.infer<typeof approveEventFormSchema>;

export const reverseEventFormSchema = z.object({
  reason: z.string().trim().min(1, 'Say why this is being reversed').max(500),
});
export type ReverseEventFormValues = z.infer<typeof reverseEventFormSchema>;

/** POST .../:obligationId/accept-claim — turns a field-submission-sourced claim into a real cost. */
export const acceptClaimFormSchema = z.object({
  amount: z.number().int('Whole naira only').min(0).optional(),
  effective_date: z.string().trim().optional(),
  note: z.string().trim().max(500).optional(),
});
export type AcceptClaimFormValues = z.infer<typeof acceptClaimFormSchema>;

/**
 * GET .../costs/:obligationId — NOT the bare `AssetCostObligationSchema`
 * shape (that's what the LIST endpoint returns). The single-obligation read
 * bundles the obligation, its cost item, a per-stage sum of approved
 * amounts, the recognised total, and every event ever recorded against it —
 * confirmed directly from `AssetCostService.getObligation()` on staging,
 * since no separate "list this obligation's events" endpoint exists.
 */
export const ObligationDetailSchema = z.object({
  obligation: AssetCostObligationSchema,
  cost_item: AssetCostItemSchema.nullable(),
  // Sparse — only stages with at least one approved event are present (see
  // `AssetCostService.getObligation()`: `Partial<Record<FinancialStage, number>>`).
  stages: z.partialRecord(FinancialStageSchema, z.number()),
  recognised_cost: z.number(),
  events: z.array(AssetCostEventSchema).default([]),
});
export type ObligationDetail = z.infer<typeof ObligationDetailSchema>;

/* -------------------- errors -------------------- */

export const COST_ERROR_CODES = [
  'COST_ASSET_NOT_FOUND',
  'COST_ITEM_NOT_FOUND',
  'COST_ITEM_NAME_TAKEN',
  'COST_ITEM_IN_USE',
  'COST_ALLOCATION_INVALID',
  'OBLIGATION_NOT_FOUND',
  'OBLIGATION_ARCHIVED',
  'COST_EVENT_NOT_FOUND',
  'COST_EVENT_NOT_DRAFT',
  'COST_EVENT_ALREADY_APPROVED',
  'COST_EVENT_NOT_APPROVED',
  'COST_EVENT_ALREADY_REVERSED',
  'COST_STAGE_DUPLICATE',
  'COST_AMOUNT_REQUIRED',
  'COST_NO_CLAIM_TO_ACCEPT',
  'COST_CLAIM_ALREADY_ACCEPTED',
  'COST_PRODUCT_NOT_ON_ASSET',
] as const;
export type CostErrorCode = (typeof COST_ERROR_CODES)[number];
