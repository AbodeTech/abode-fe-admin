import type { FieldMetricKey } from '../schemas/scorecard.schema';
import type { FieldSubmission } from '../schemas/submission.schema';

/* ============================================================
 * The month split into its own weeks — days 1–7, 8–14, 15–21, 22–28 and
 * 29 to the end — and submissions bucketed into them by work date.
 * Display only: the score is still worked out for the whole month.
 * ============================================================ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type MonthWeek = { index: number; from: number; to: number; label: string; future: boolean };

export function monthWeeks(year: number, month: number, now = new Date()): MonthWeek[] {
  const days = new Date(year, month, 0).getDate();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
  const weeks: MonthWeek[] = [];
  for (let from = 1, i = 0; from <= days; from += 7, i += 1) {
    const to = Math.min(from + 6, days);
    weeks.push({
      index: i,
      from,
      to,
      label: from === to ? `${from} ${MONTHS[month - 1]}` : `${from}–${to} ${MONTHS[month - 1]}`,
      future: isFuture || (isCurrent && from > now.getDate()),
    });
  }
  return weeks;
}

export type WeekTotals = { verified: number; waiting: number };

/**
 * Per week, what counts towards one target: verified work, and work still
 * waiting for review. Uses each submission's scoring quantity, so repairs and
 * rework add nothing — the same basis as the monthly figure.
 */
export function weeklyTotals(subs: FieldSubmission[], metric: FieldMetricKey, weeks: MonthWeek[]): WeekTotals[] {
  const totals = weeks.map(() => ({ verified: 0, waiting: 0 }));
  for (const sub of subs) {
    if (sub.metric_key !== metric || !sub.work_date || !sub.counts_towards_target) continue;
    if (sub.status !== 'verified' && sub.status !== 'submitted') continue;
    const day = Number(sub.work_date.slice(8, 10));
    const week = weeks.findIndex((w) => day >= w.from && day <= w.to);
    if (week < 0) continue;
    totals[week][sub.status === 'verified' ? 'verified' : 'waiting'] += sub.quantity;
  }
  return totals;
}
