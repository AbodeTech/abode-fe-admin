import { z } from 'zod';

import { OFFER_TYPES, OfferTypeSchema, type OfferType } from './asset.schema';
import {
  CostGroupSchema,
  type AllocationBasis,
  type AssetCostItem,
  type CostGroup,
  type FinancialStage,
  type ObligationDetail,
} from './asset-cost.schema';

/* ============================================================
 * The one-form "Add cost" (asset-detail design), over a backend that needs
 * up to three calls to do what the form shows as one action:
 *
 *   1. POST .../costs/items             only when the cost item is new
 *   2. POST .../costs                   the record, plus its first entry
 *   3. POST /admin/cost-entries/:id/approve   only for "Add cost" (not a draft)
 *
 * This file is the part with no React in it: the form's shape and rules,
 * `planAddCost` (form values → the calls to make) and `runAddCost` (make
 * them in order, remembering what already succeeded so a retry never
 * repeats a finished step).
 * ============================================================ */

/** What an admin can record. The backend also has `claimed` (staff claims) and the system-made `reversal`/`adjustment`. */
export const ADD_COST_STAGES = ['budget', 'committed', 'incurred', 'paid'] as const satisfies readonly FinancialStage[];
export type AddCostStage = (typeof ADD_COST_STAGES)[number];

export const ADD_COST_STAGE_LABELS: Record<AddCostStage, string> = {
  budget: 'Budget',
  committed: 'Commitment',
  incurred: 'Incurred cost',
  paid: 'Payment',
};

/** The "Cost group" select's value for "this is a new cost item". */
export const NEW_COST_ITEM = '__new__';
/** The "Scope" select's value for "shared across products". */
export const SHARED_SCOPE = 'shared';

/**
 * Split rules a new shared item can be created with. `manual` and `amount`
 * need per-product percentages or sums, and `direct` means one product —
 * those are set afterwards from "Edit basis" (or by choosing a product as
 * the scope), so they are not offered here.
 */
export const NEW_ITEM_BASES = [
  'saleable_sqm',
  'product_sqm',
  'total_sqm',
  'sqm_sold',
  'revenue',
  'units',
  'equal',
] as const satisfies readonly AllocationBasis[];

export const addCostFormSchema = z
  .object({
    stage: z.enum(ADD_COST_STAGES),
    /** An existing cost item's id, or `NEW_COST_ITEM`. */
    cost_item_id: z.string().min(1, 'Choose a cost group'),
    new_item_name: z.string().trim().max(120).optional(),
    new_item_group: CostGroupSchema.optional(),
    /** `SHARED_SCOPE`, or the one product this cost belongs to. */
    scope: z.union([z.literal(SHARED_SCOPE), OfferTypeSchema]).optional(),
    allocation_basis: z.enum(NEW_ITEM_BASES).optional(),
    title: z.string().trim().min(1, 'Give this cost a title').max(160),
    description: z.string().trim().max(500).optional(),
    /** Optional on purpose: an unknown amount is left out, never sent as 0. */
    amount: z.number().int('Whole naira only').min(0, 'Cannot be negative').optional(),
    effective_date: z.string().trim().min(1, 'Enter an effective date'),
    vendor: z.string().trim().max(120).optional(),
    reference: z.string().trim().max(120).optional(),
    evidence_url: z.string().trim().optional(),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.cost_item_id !== NEW_COST_ITEM) return;
    if (!values.new_item_name) {
      ctx.addIssue({ code: 'custom', path: ['new_item_name'], message: 'Name the new cost item' });
    }
    if (!values.new_item_group) {
      ctx.addIssue({ code: 'custom', path: ['new_item_group'], message: 'Choose a finance group' });
    }
    if (!values.scope) {
      ctx.addIssue({ code: 'custom', path: ['scope'], message: 'Choose what this cost applies to' });
    }
    if (values.scope === SHARED_SCOPE && !values.allocation_basis) {
      ctx.addIssue({ code: 'custom', path: ['allocation_basis'], message: 'Choose how it is split' });
    }
  });

export type AddCostFormValues = z.input<typeof addCostFormSchema>;
export type AddCostFormOutput = z.output<typeof addCostFormSchema>;

/* -------------------- the plan -------------------- */

export type NewCostItemPayload = {
  group: CostGroup;
  name: string;
  is_shared: boolean;
  allocation_basis?: AllocationBasis;
};

export type NewCostRecordPayload = {
  title: string;
  description?: string;
  product?: OfferType;
  vendor?: string;
  reference?: string;
  effective_date: string;
  amount?: number;
  stage: AddCostStage;
  note?: string;
  evidence?: { url: string; caption?: string }[];
};

export type AddCostPlan = {
  /** `null` when the record goes on a cost item that already exists. */
  newItem: NewCostItemPayload | null;
  /** The existing item's id; `null` when `newItem` is set (the id comes from step 1). */
  existingItemId: string | null;
  record: NewCostRecordPayload;
  /** Approve the first entry after saving, so it counts. False for "Save draft". */
  approve: boolean;
};

/** A problem only the plan can see: the form is valid, but this combination can't be saved. */
export type AddCostPlanError = { field: 'scope' | 'amount'; message: string };

const blank = (value: string | undefined) => (value ? value : undefined);

/**
 * Turns the validated form into the calls to make.
 *
 * The product a record is booked to:
 *  - new item with a product as its scope → that product (the item is not shared);
 *  - new shared item → none, the split rule spreads it;
 *  - existing shared item → none;
 *  - existing item that is not shared → the product chosen in Scope, which
 *    is required: the backend can't place an unshared cost with no product
 *    on an estate with several products.
 */
export function planAddCost(
  values: AddCostFormOutput,
  items: Pick<AssetCostItem, 'id' | 'is_shared'>[],
  options: { approve: boolean }
): AddCostPlan | AddCostPlanError {
  const isNew = values.cost_item_id === NEW_COST_ITEM;
  const existing = isNew ? undefined : items.find((item) => item.id === values.cost_item_id);
  const scopeProduct = values.scope && values.scope !== SHARED_SCOPE ? values.scope : undefined;

  if (!isNew && existing && !existing.is_shared && !scopeProduct) {
    return { field: 'scope', message: 'Choose the product this cost belongs to' };
  }
  if (options.approve && values.amount === undefined) {
    return { field: 'amount', message: 'Enter an amount, or save it as a draft without one' };
  }

  const shared = isNew ? values.scope === SHARED_SCOPE : (existing?.is_shared ?? false);

  return {
    newItem: isNew
      ? {
          group: values.new_item_group as CostGroup,
          name: values.new_item_name as string,
          is_shared: shared,
          ...(shared && values.allocation_basis ? { allocation_basis: values.allocation_basis } : {}),
        }
      : null,
    existingItemId: isNew ? null : values.cost_item_id,
    record: {
      title: values.title,
      description: blank(values.description),
      product: shared ? undefined : scopeProduct,
      vendor: blank(values.vendor),
      reference: blank(values.reference),
      effective_date: values.effective_date,
      amount: values.amount,
      stage: values.stage,
      note: blank(values.note),
      evidence: values.evidence_url ? [{ url: values.evidence_url, caption: 'Evidence' }] : undefined,
    },
    // Nothing to approve when no amount was given: the backend writes no entry at all.
    approve: options.approve && values.amount !== undefined,
  };
}

export function isPlanError(result: AddCostPlan | AddCostPlanError): result is AddCostPlanError {
  return 'field' in result;
}

/* -------------------- running the plan -------------------- */

export type AddCostStep = 'item' | 'record' | 'approve';

/** What has already been saved. Kept by the form between attempts. */
export type AddCostProgress = {
  itemId?: string;
  record?: ObligationDetail;
};

/** The three backend calls, passed in so the same runner serves the app and the tests. */
export type AddCostApi = {
  createItem: (payload: NewCostItemPayload) => Promise<{ id: string }>;
  createRecord: (payload: NewCostRecordPayload & { cost_item_id: string }) => Promise<ObligationDetail>;
  approveEntry: (entryId: string) => Promise<unknown>;
};

/** Thrown with the step that failed, so the form can say exactly what was and wasn't saved. */
export class AddCostStepError extends Error {
  readonly name = 'AddCostStepError';
  constructor(
    readonly step: AddCostStep,
    readonly cause: unknown
  ) {
    super(cause instanceof Error ? cause.message : String(cause));
  }
}

/**
 * Makes the plan's calls in order. `progress` is written to as each step
 * lands and read at the start of each step, so calling this again after a
 * failure picks up where it stopped: an item already created is not created
 * again, and a record already saved is not saved again.
 */
export async function runAddCost(api: AddCostApi, plan: AddCostPlan, progress: AddCostProgress): Promise<ObligationDetail> {
  let itemId = plan.existingItemId ?? progress.itemId;
  if (!itemId) {
    try {
      itemId = (await api.createItem(plan.newItem as NewCostItemPayload)).id;
    } catch (cause) {
      throw new AddCostStepError('item', cause);
    }
    progress.itemId = itemId;
  }

  if (!progress.record) {
    try {
      progress.record = await api.createRecord({ ...plan.record, cost_item_id: itemId });
    } catch (cause) {
      throw new AddCostStepError('record', cause);
    }
  }

  if (plan.approve) {
    const draft = progress.record.events.find((entry) => entry.status === 'draft');
    if (draft) {
      try {
        await api.approveEntry(draft.id);
      } catch (cause) {
        throw new AddCostStepError('approve', cause);
      }
    }
  }

  return progress.record;
}

/** Products a cost can be booked to on this estate — the ones it actually sells. */
export function bookableProducts(offers: { offer_type: OfferType }[]): OfferType[] {
  const selling = new Set(offers.map((offer) => offer.offer_type));
  return OFFER_TYPES.filter((type) => selling.has(type));
}
