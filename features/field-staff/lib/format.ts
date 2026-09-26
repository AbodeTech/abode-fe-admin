import type { FieldMetricUnit } from '../schemas/scorecard.schema';

const UNIT_SUFFIX: Record<FieldMetricUnit, [string, string]> = {
  metres: ['m', 'm'],
  sqm: ['sqm', 'sqm'],
  plots: ['plot', 'plots'],
  customers: ['customer', 'customers'],
};

/** 1,200 sqm · 28 m · 5 plots · 1 customer. Unknown units pass through. */
export function formatQuantity(value: number, unit: string | null | undefined): string {
  const n = value.toLocaleString('en-NG', { maximumFractionDigits: 2 });
  const suffix = UNIT_SUFFIX[unit as FieldMetricUnit];
  if (!suffix) return unit ? `${n} ${unit}` : n;
  if (unit === 'metres') return `${n} m`;
  return `${n} ${value === 1 ? suffix[0] : suffix[1]}`;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** Scores are 0–100 numbers; null means there is nothing to score. */
export function formatScore(score: number | null | undefined): string {
  return score === null || score === undefined ? '—' : `${score.toFixed(1)}%`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatPeriod(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** 21 Sep 2026 — for ISO timestamps or YYYY-MM-DD strings. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Yesterday", "3 days ago" — how long something has waited. */
export function waitingFor(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/** Has the month finished? A scorecard can only be finalised after it has. */
export function monthEnded(year: number, month: number, now = new Date()): boolean {
  return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
}
