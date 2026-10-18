/**
 * Shared number formatting.
 *
 * Money across the platform is **decimal naira** (2500.5 = ₦2,500.50), not
 * integer kobo. Nothing here multiplies or divides by 100 — that conversion
 * belongs at the Paystack boundary on the backend, nowhere else.
 */

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNaira(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return nairaFormatter.format(amount);
}

/**
 * A rate stored as a fraction, shown as a percentage: `0.105` → `"10.50%"`.
 *
 * Display only. The stored value is never rounded — rounding 0.105 to two
 * decimal places would be a 5% error in the rate itself.
 */
export function formatPercent(rate: number | null | undefined, fractionDigits = 2): string {
  if (rate == null || Number.isNaN(rate)) return '—';
  return `${(rate * 100).toFixed(fractionDigits)}%`;
}

/**
 * Money at a glance: `41250000` → `"₦41.3M"`.
 *
 * For stat cards and sub-lines where the exact figure would crowd the layout —
 * never for a table cell or a receipt, where the full `formatNaira` belongs.
 * Same decimal-naira assumption as everything else here.
 */
export function formatNairaCompact(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return formatNaira(amount);
}

/**
 * Land area at a glance: `41250` → `"41k SQM"`. Same rounding tradeoff as
 * `formatNairaCompact` — for stat cards and sub-lines, never a value an
 * admin needs to type back in exactly. Matches the thresholds every
 * asset-feature component already reimplements locally (InventoryHealthBar,
 * AssetHealthBar, AssetCategoryHealth, PaymentPlanMatrix) — this is the
 * canonical version new code should import instead of copying again.
 */
/**
 * Land area in full: `136830` → `"136,830 sqm"`. For land-account and ledger
 * figures an admin reconciles against each other, where `formatSqm`'s rounding
 * ("137k SQM") would hide the difference being checked.
 */
export function formatSqmExact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })} sqm`;
}

export function formatSqm(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (value === 0) return '0 SQM';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M SQM`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k SQM`;
  return `${value.toFixed(0)} SQM`;
}
