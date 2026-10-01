import type {
  AssetCostEvent,
  AssetCostItem,
  FinancialStage,
  ObligationDetail,
} from './asset-cost.schema';

/* ============================================================
 * The Costs tab's figures, built from what the backend returns today.
 *
 * The backend's model has three layers:
 *
 *   cost item   "Perimeter fencing" — what kind of cost, and how it is shared
 *     └ record  "Fencing — phase 1" — one thing being paid for
 *         └ entry  one amount at one stage: budget → committed → claimed →
 *                  incurred → paid (plus reversal / adjustment). An entry
 *                  counts only once it is APPROVED.
 *
 * Approved amounts by stage are only returned per record
 * (`GET .../costs/:obligationId` → `stages`, `recognised_cost`). There is no
 * endpoint for the same totals per cost item or for the estate, so this file
 * adds the records up. It is pure arithmetic over those responses — nothing
 * is estimated — and it is the one place that would be replaced if the
 * backend exposed its own summary.
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
  records: ObligationDetail[];
  totals: StageTotals;
  /** Budget minus incurred. `null` when there is no approved budget to measure against. Negative = over budget. */
  remaining: number | null;
  /** Entries recorded but not yet approved, so not in any figure above. */
  pending: number;
  status: CostRowStatus;
};

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

function statusFor(records: ObligationDetail[], totals: StageTotals, remaining: number | null, pending: number): CostRowStatus {
  const hasAnyEntry = records.some((record) => record.events.length > 0);
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
    return { item, records: own, totals, remaining, pending, status: statusFor(own, totals, remaining, pending) };
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
