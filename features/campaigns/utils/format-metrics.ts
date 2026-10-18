import type { RewardType } from '../schemas/campaign.schema';

const wholeNumber = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });
const compactNumber = new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 });
const shortDay = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' });

export function formatCount(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? '—' : wholeNumber.format(value);
}

export function formatSqm(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? '—' : `${wholeNumber.format(value)} sqm`;
}

/** Axis ticks: `12500` → `12.5K`. */
export function formatCompact(value: number): string {
  return compactNumber.format(value);
}

/** A `YYYY-MM-DD` day key as `5 Jul`. Parsed as a calendar day, never shifted by timezone. */
export function formatDayKey(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return shortDay.format(new Date(year, month - 1, date));
}

export function rewardNoun(type: RewardType, count: number): string {
  const noun = type === 'ticket' ? 'ticket' : 'hamper';
  return count === 1 ? noun : `${noun}s`;
}

export function personName(first: string | null | undefined, last: string | null | undefined): string {
  return [first, last].filter(Boolean).join(' ') || 'Unknown';
}

const nairaWhole = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/** Table cells and per-sqm prices: `₦5,500` — kobo would only be noise here. */
export function formatNairaWhole(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? '—' : nairaWhole.format(value);
}
