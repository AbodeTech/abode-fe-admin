import type { SalesDashboardResponse } from '../schemas/sales.schema';

/**
 * Everything the Yesterday card shows that is not read straight off the
 * backend. The money itself (sold, collected) is summed server-side by
 * GET /admin/sales/dashboard; this only compares and proportions it.
 */

export const SALE_TYPES = [
  { key: 'flex', label: 'Flex' },
  { key: 'full_ownership', label: 'Full ownership' },
  { key: 'commercial', label: 'Commercial' },
] as const;

export type SaleTypeKey = (typeof SALE_TYPES)[number]['key'] | 'other';

export interface SaleTypeShare {
  key: SaleTypeKey;
  label: string;
  value: number;
  /** 0–100, of the day's overall sale value. */
  share: number;
}

export interface DayChange {
  /** Yesterday minus the day before, in naira. */
  amount: number;
  /** Relative change; null when the day before sold nothing (no base to compare). */
  percent: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface YesterdaySummary {
  sold: number;
  collected: number;
  /** 0–100, collected as a share of sold; null when nothing sold. */
  collectedShare: number | null;
  change: DayChange | null;
  split: SaleTypeShare[];
}

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

export function compareDays(current: number, previous: number): DayChange {
  const amount = current - previous;
  return {
    amount,
    percent: previous > 0 ? (amount / previous) * 100 : null,
    direction: amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat',
  };
}

/**
 * The overall card covers every revenue-eligible asset type, the three named
 * cards only theirs. Any gap between them is shown as "Other" rather than
 * dropped, so the split always adds up to the headline figure.
 */
export function splitByType(day: SalesDashboardResponse): SaleTypeShare[] {
  const total = day.overall.total;
  const named = SALE_TYPES.map(({ key, label }) => ({
    key,
    label,
    value: day[key].total,
    share: pct(day[key].total, total),
  }));
  const other = total - named.reduce((sum, t) => sum + t.value, 0);
  const rows: SaleTypeShare[] = other > 0 ? [...named, { key: 'other', label: 'Other', value: other, share: pct(other, total) }] : named;
  return rows.filter((t) => t.value > 0);
}

export function summariseYesterday(
  yesterday: SalesDashboardResponse,
  dayBefore: SalesDashboardResponse | undefined
): YesterdaySummary {
  const sold = yesterday.overall.total;
  const collected = yesterday.overall.received;
  return {
    sold,
    collected,
    collectedShare: sold > 0 ? pct(collected, sold) : null,
    change: dayBefore ? compareDays(sold, dayBefore.overall.total) : null,
    split: splitByType(yesterday),
  };
}
