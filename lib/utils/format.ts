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
