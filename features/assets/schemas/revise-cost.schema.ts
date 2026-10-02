import { z } from 'zod';

import type { AssetCostEvent, ObligationDetail } from './asset-cost.schema';
import { recognisedCost } from './cost-ledger.schema';

/* ============================================================
 * The "Revise" modal for one cost record (asset-detail design), over what
 * the backend actually lets you change:
 *
 *   - the record's own details (title, vendor, product…) — nothing. There is
 *     no update call for a record, only archive.
 *   - a DRAFT entry — amount, date, vendor, reference, note
 *     (PATCH /admin/cost-entries/:id).
 *   - an APPROVED entry — cannot be edited, only reversed with a reason
 *     (POST /admin/cost-entries/:id/reverse). It stays on record.
 *   - new entries — any stage, any time (POST .../costs/:id/stages), always
 *     saved as a draft that must be approved to count.
 *
 * Amounts at a stage add up and cannot be negative, so the design's five
 * choices map like this:
 *
 *   Correct details   edit a draft entry
 *   Create revision   replace the budget: add the revised budget, reverse
 *                     the old one(s), approve the new one
 *   Add commitment    a new `committed` entry
 *   Record invoice    a new `incurred` entry
 *   Record payment    a new `paid` entry
 *
 * No React in this file: form rules, plans, and the resumable runners.
 * ============================================================ */

export const REVISE_MODES = ['correct', 'revision', 'committed', 'incurred', 'paid'] as const;
export type ReviseMode = (typeof REVISE_MODES)[number];

export const REVISE_MODE_LABELS: Record<ReviseMode, string> = {
  correct: 'Correct details',
  revision: 'Create revision',
  committed: 'Add commitment',
  incurred: 'Record invoice',
  paid: 'Record payment',
};

/** The three modes that simply add an entry at a stage. */
export type StageMode = Extract<ReviseMode, 'committed' | 'incurred' | 'paid'>;
export const isStageMode = (mode: ReviseMode): mode is StageMode =>
  mode === 'committed' || mode === 'incurred' || mode === 'paid';

/**
 * Why a budget is being revised. The backend has no field for this, so it is
 * written at the start of the entry's note, where the cost history shows it.
 */
export const REVISION_SOURCES = ['contract_variation', 'scope_increase', 'updated_estimate', 'correction'] as const;
export type RevisionSource = (typeof REVISION_SOURCES)[number];

export const REVISION_SOURCE_LABELS: Record<RevisionSource, string> = {
  contract_variation: 'Contract variation',
  scope_increase: 'Scope increase',
  updated_estimate: 'Updated estimate',
  correction: 'Correction',
};

const amount = z.number({ message: 'Enter an amount' }).int('Whole naira only').min(0, 'Cannot be negative');
const date = z.string().trim().min(1, 'Enter an effective date');

export const budgetRevisionFormSchema = z.object({
  amount,
  effective_date: date,
  source: z.enum(REVISION_SOURCES),
  reason: z.string().trim().min(1, 'Say why the budget is changing').max(400),
  reference: z.string().trim().max(120).optional(),
  evidence_url: z.string().trim().optional(),
});
export type BudgetRevisionFormValues = z.input<typeof budgetRevisionFormSchema>;
export type BudgetRevisionFormOutput = z.output<typeof budgetRevisionFormSchema>;

export const stageEntryFormSchema = z.object({
  amount,
  effective_date: date,
  vendor: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  evidence_url: z.string().trim().optional(),
});
export type StageEntryFormValues = z.input<typeof stageEntryFormSchema>;
export type StageEntryFormOutput = z.output<typeof stageEntryFormSchema>;

export const correctDraftFormSchema = z.object({
  entry_id: z.string().min(1, 'Choose the entry to correct'),
  amount,
  effective_date: date,
  vendor: z.string().trim().max(120).optional(),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CorrectDraftFormValues = z.input<typeof correctDraftFormSchema>;
export type CorrectDraftFormOutput = z.output<typeof correctDraftFormSchema>;

/* -------------------- reading a record -------------------- */

/** The record's four figures, as the modal's "current record" strip shows them. `null` = nothing approved at that stage. */
export function recordFigures(record: ObligationDetail) {
  const budget = record.stages.budget ?? null;
  const incurred = recognisedCost(record);
  return {
    budget,
    committed: record.stages.committed ?? null,
    incurred,
    paid: record.stages.paid ?? null,
    /** Budget minus incurred; `null` with no budget. */
    remaining: budget == null ? null : budget - (incurred ?? 0),
  };
}

/** Entries that can still be edited. */
export const draftEntries = (record: ObligationDetail): AssetCostEvent[] =>
  record.events.filter((entry) => entry.status === 'draft');

/** Approved budget entries — what a revision replaces. */
export const approvedBudgetEntries = (record: ObligationDetail): AssetCostEvent[] =>
  record.events.filter((entry) => entry.financial_stage === 'budget' && entry.status === 'approved');

/** When anything last happened on the record, for the modal's subtitle. */
export function lastChangedAt(record: ObligationDetail): string | null {
  const times = record.events
    .map((entry) => entry.approved_at ?? entry.created_at)
    .filter((value): value is string => Boolean(value))
    .sort();
  return times.length > 0 ? times[times.length - 1] : null;
}

/**
 * What the chosen change would do to the record's remaining forecast (budget
 * minus incurred). Plain arithmetic on figures already on screen — the
 * backend's own impact preview only covers split-rule changes.
 */
export function forecastImpact(record: ObligationDetail, mode: ReviseMode, newAmount: number | undefined) {
  const before = recordFigures(record);
  if (newAmount === undefined || (mode !== 'revision' && mode !== 'incurred')) return null;

  const budget = mode === 'revision' ? newAmount : before.budget;
  const incurred = mode === 'incurred' ? (before.incurred ?? 0) + newAmount : before.incurred;
  return {
    previousRemaining: before.remaining,
    revisedRemaining: budget == null ? null : budget - (incurred ?? 0),
    /** Only an incurred cost moves profit; a budget does not. */
    profitChange: mode === 'incurred' ? -newAmount : 0,
  };
}

/* -------------------- running a change -------------------- */

export type StageEntryPayload = {
  stage: 'budget' | StageMode;
  amount: number;
  effective_date: string;
  vendor?: string;
  reference?: string;
  note?: string;
  evidence?: { url: string; caption?: string }[];
};

/** The backend calls the modal needs, passed in so the app and the tests share the runners. */
export type ReviseCostApi = {
  addEntry: (payload: StageEntryPayload) => Promise<{ id: string }>;
  approveEntry: (entryId: string) => Promise<unknown>;
  reverseEntry: (entryId: string, reason: string) => Promise<unknown>;
};

export type ReviseStep = 'add' | 'reverse' | 'approve';

export class ReviseStepError extends Error {
  readonly name = 'ReviseStepError';
  constructor(
    readonly step: ReviseStep,
    readonly cause: unknown
  ) {
    super(cause instanceof Error ? cause.message : String(cause));
  }
}

/** What has already been done. Kept by the modal between attempts so a retry repeats only what failed. */
export type ReviseProgress = {
  entryId?: string;
  reversed?: string[];
  approved?: boolean;
};

const blank = (value: string | undefined) => (value ? value : undefined);
const evidenceFor = (url: string | undefined) => (url ? [{ url, caption: 'Evidence' }] : undefined);

export function stageEntryPayload(stage: StageMode, values: StageEntryFormOutput): StageEntryPayload {
  return {
    stage,
    amount: values.amount,
    effective_date: values.effective_date,
    vendor: blank(values.vendor),
    reference: blank(values.reference),
    note: blank(values.note),
    evidence: evidenceFor(values.evidence_url),
  };
}

/** Adds one entry and, if asked, approves it. */
export async function runStageEntry(
  api: ReviseCostApi,
  payload: StageEntryPayload,
  approve: boolean,
  progress: ReviseProgress
): Promise<void> {
  if (!progress.entryId) {
    try {
      progress.entryId = (await api.addEntry(payload)).id;
    } catch (cause) {
      throw new ReviseStepError('add', cause);
    }
  }
  if (approve && !progress.approved) {
    try {
      await api.approveEntry(progress.entryId);
    } catch (cause) {
      throw new ReviseStepError('approve', cause);
    }
    progress.approved = true;
  }
}

export type BudgetRevisionPlan = {
  entry: StageEntryPayload;
  /** The approved budget entries the new one replaces. */
  reverseIds: string[];
  reason: string;
};

export function planBudgetRevision(record: ObligationDetail, values: BudgetRevisionFormOutput): BudgetRevisionPlan {
  const reason = `${REVISION_SOURCE_LABELS[values.source]}: ${values.reason}`;
  return {
    entry: {
      stage: 'budget',
      amount: values.amount,
      effective_date: values.effective_date,
      reference: blank(values.reference),
      note: reason,
      evidence: evidenceFor(values.evidence_url),
    },
    reverseIds: approvedBudgetEntries(record).map((entry) => entry.id),
    reason,
  };
}

/**
 * Replaces the record's budget.
 *
 * Budget entries add up, so a "revised budget" can't be a single edit: the
 * new figure is added, the old approved one(s) are reversed, and the new one
 * is approved. The order is chosen so that stopping at any point leaves the
 * record understated rather than double-counted:
 *
 *   after "add"      old budget intact, new one waiting as a draft
 *   after "reverse"  old budget gone, new one still a draft (budget unknown)
 *   after "approve"  done
 *
 * Reversed entries stay on the record, so the earlier budget remains in the
 * history.
 */
export async function runBudgetRevision(api: ReviseCostApi, plan: BudgetRevisionPlan, progress: ReviseProgress): Promise<void> {
  if (!progress.entryId) {
    try {
      progress.entryId = (await api.addEntry(plan.entry)).id;
    } catch (cause) {
      throw new ReviseStepError('add', cause);
    }
  }

  progress.reversed ??= [];
  for (const id of plan.reverseIds) {
    if (progress.reversed.includes(id)) continue;
    try {
      await api.reverseEntry(id, plan.reason);
    } catch (cause) {
      throw new ReviseStepError('reverse', cause);
    }
    progress.reversed.push(id);
  }

  if (!progress.approved) {
    try {
      await api.approveEntry(progress.entryId);
    } catch (cause) {
      throw new ReviseStepError('approve', cause);
    }
    progress.approved = true;
  }
}
