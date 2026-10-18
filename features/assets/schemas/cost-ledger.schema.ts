import { z } from 'zod';

import {
  AssetCostEventSchema,
  AssetCostObligationSchema,
  type AssetCostEvent,
  type AssetCostItem,
  type FinancialStage,
  type ObligationDetail,
} from './asset-cost.schema';

/* ============================================================
 * The Costs tab's figures and the backend summary contract.
 *
 * The backend's model has three layers:
 *
 *   cost item   "Perimeter fencing" — what kind of cost, and how it is shared
 *     └ record  "Fencing — phase 1" — one thing being paid for
 *         └ entry  one amount at one stage: budget → committed → claimed →
 *                  incurred → paid (plus reversal / adjustment). An entry
 *                  counts only once it is APPROVED.
 *
 * `GET .../costs/summary` returns complete estate, item and record rollups.
 * The older pure helpers remain below for deterministic calculation tests and
 * compatibility with any caller that already holds full obligation details.
 * ============================================================ */

/** `null` means "no approved entry at that stage", which is not the same as zero. */
export type StageTotals = {
  budget: number | null;
  committed: number | null;
  /** Recognised cost: incurred, plus adjustments, minus reversals — the figure profit uses. */
  incurred: number | null;
  paid: number | null;
};

export type CostRowStatus = 'missing' | 'pending' | 'over_budget' | 'complete' | 'in_progress';

export type CostLedgerRow = {
  item: AssetCostItem;
  records: CostSummaryRecord[];
  totals: StageTotals;
  /** Budget minus incurred. `null` when there is no approved budget to measure against. Negative = over budget. */
  remaining: number | null;
  /** Entries recorded but not yet approved, so not in any figure above. */
  pending: number;
  status: CostRowStatus;
};

const NullableStageTotalsSchema = z.object({
  budget: z.number().nullable(),
  committed: z.number().nullable(),
  incurred: z.number().nullable(),
  paid: z.number().nullable(),
});

export const CostSummaryRecordSchema = z.object({
  obligation: AssetCostObligationSchema,
  stages: NullableStageTotalsSchema,
  recognised_cost: z.number().nullable(),
  pending_entries: z.number(),
  unknown_amounts: z.number(),
  entry_count: z.number(),
});
export type CostSummaryRecord = z.infer<typeof CostSummaryRecordSchema>;

export const CostSummarySchema = z.object({
  totals: z.object({
    budget: z.number().nullable(),
    committed: z.number().nullable(),
    incurred: z.number().nullable(),
    paid: z.number().nullable(),
    remaining: z.number().nullable(),
    without_budget: z.number(),
  }),
  items: z.array(z.object({
    cost_item_id: z.string(),
    is_active: z.boolean(),
    stages: NullableStageTotalsSchema,
    remaining: z.number().nullable(),
    pending_entries: z.number(),
    unknown_amounts: z.number(),
    entry_count: z.number(),
    record_count: z.number(),
    records: z.array(CostSummaryRecordSchema),
  })),
  recent_entries: z.array(z.object({
    event: AssetCostEventSchema,
    record_title: z.string().nullable(),
    cost_item_name: z.string().nullable(),
  })),
  recent_entries_truncated: z.boolean(),
});
export type CostSummary = z.infer<typeof CostSummarySchema>;

const RECOGNISED: readonly FinancialStage[] = ['incurred', 'reversal', 'adjustment'];

/** Adds one stage across records, staying `null` until some record actually has it. */
function sumStage(records: ObligationDetail[], stage: FinancialStage): number | null {
  let total: number | null = null;
  for (const record of records) {
    const amount = record.stages[stage];
    if (amount != null) total = (total ?? 0) + amount;
  }
  return total;
}

/** One record's recognised cost, or `null` when nothing recognisable has been approved on it. */
export function recognisedCost(record: ObligationDetail): number | null {
  return RECOGNISED.some((stage) => record.stages[stage] != null) ? record.recognised_cost : null;
}

function recognised(records: ObligationDetail[]): number | null {
  return records.reduce<number | null>((total, record) => {
    const value = recognisedCost(record);
    return value == null ? total : (total ?? 0) + value;
  }, null);
}

function statusFor(records: CostSummaryRecord[], totals: StageTotals, remaining: number | null, pending: number): CostRowStatus {
  const hasAnyEntry = records.some((record) => record.entry_count > 0);
  if (!hasAnyEntry) return 'missing';
  if (pending > 0) return 'pending';
  if (remaining != null && remaining < 0) return 'over_budget';
  const incurred = totals.incurred ?? 0;
  const paidInFull = incurred > 0 && totals.paid != null && totals.paid >= incurred;
  const budgetSpent = totals.budget == null || incurred >= totals.budget;
  return paidInFull && budgetSpent ? 'complete' : 'in_progress';
}

/** One row per cost item, in the order the items were given, with its records' figures added up. */
export function costLedger(items: AssetCostItem[], records: ObligationDetail[]): CostLedgerRow[] {
  return items.map((item) => {
    const own = records.filter((record) => record.obligation.cost_item.id === item.id);
    const totals: StageTotals = {
      budget: sumStage(own, 'budget'),
      committed: sumStage(own, 'committed'),
      incurred: recognised(own),
      paid: sumStage(own, 'paid'),
    };
    const remaining = totals.budget == null ? null : totals.budget - (totals.incurred ?? 0);
    const pending = own.reduce(
      (count, record) => count + record.events.filter((event) => event.status === 'draft').length,
      0
    );
    const summaries: CostSummaryRecord[] = own.map((record) => ({
      obligation: record.obligation,
      stages: {
        budget: record.stages.budget ?? null,
        committed: record.stages.committed ?? null,
        incurred: recognisedCost(record),
        paid: record.stages.paid ?? null,
      },
      recognised_cost: recognisedCost(record),
      pending_entries: record.events.filter((event) => event.status === 'draft').length,
      unknown_amounts: record.events.filter((event) => event.amount == null).length,
      entry_count: record.events.length,
    }));
    return { item, records: summaries, totals, remaining, pending, status: statusFor(summaries, totals, remaining, pending) };
  });
}

/** Joins the endpoint's financial rollups to the existing item metadata. */
export function costLedgerFromSummary(items: AssetCostItem[], summary: CostSummary): CostLedgerRow[] {
  const byItem = new Map(summary.items.map((row) => [row.cost_item_id, row]));
  return items.map((item) => {
    const source = byItem.get(item.id);
    const totals: StageTotals = source?.stages ?? { budget: null, committed: null, incurred: null, paid: null };
    const records = source?.records ?? [];
    const remaining = source?.remaining ?? null;
    const pending = source?.pending_entries ?? 0;
    return { item, records, totals, remaining, pending, status: statusFor(records, totals, remaining, pending) };
  });
}

/**
 * The summary strip: each stage across every row. A stage nobody has an
 * approved entry for stays `null` (shown as a dash) rather than becoming ₦0.
 * `withoutBudget` is how many rows have no budget to forecast from.
 */
export function costLedgerTotals(rows: CostLedgerRow[]) {
  const sum = (pick: (row: CostLedgerRow) => number | null) =>
    rows.reduce<number | null>((total, row) => {
      const value = pick(row);
      return value == null ? total : (total ?? 0) + value;
    }, null);

  return {
    budget: sum((row) => row.totals.budget),
    committed: sum((row) => row.totals.committed),
    incurred: sum((row) => row.totals.incurred),
    paid: sum((row) => row.totals.paid),
    // Over-budget rows have nothing left to spend, not a negative remainder.
    remaining: sum((row) => (row.remaining == null ? null : Math.max(0, row.remaining))),
    withoutBudget: rows.filter((row) => row.totals.budget == null).length,
  };
}

export type CostHistoryEntry = {
  event: AssetCostEvent;
  recordTitle: string;
  itemName: string | null;
  /** When it happened: approval time if approved, otherwise when it was recorded. */
  at: string | null;
};

/** Every entry on every record, newest first — the estate's cost history. */
export function costHistory(records: ObligationDetail[]): CostHistoryEntry[] {
  const time = (value: string | null) => (value ? new Date(value).getTime() : 0);

  return records
    .flatMap((record) =>
      record.events.map((event) => ({
        event,
        recordTitle: record.obligation.title,
        itemName: record.obligation.cost_item.name,
        at: event.approved_at ?? event.created_at ?? event.effective_date,
      }))
    )
    .sort((a, b) => time(b.at) - time(a.at));
}

export function costHistoryFromSummary(summary: CostSummary): CostHistoryEntry[] {
  return summary.recent_entries.map((row) => ({
    event: row.event,
    recordTitle: row.record_title ?? 'Cost record',
    itemName: row.cost_item_name,
    at: row.event.approved_at ?? row.event.created_at ?? row.event.effective_date,
  }));
}
