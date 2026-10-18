/* Display formatting for Flex pricing, ported from the Flex 2.0 admin mockup. */

/** ₦3,600,000 — and ₦152,727.27 only when there are kobo to show. */
export function formatNairaTrim(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  const hasKobo = Math.abs(amount * 100 - Math.round(amount) * 100) > 1e-6;
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: hasKobo ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/**
 * A discount as a customer-friendly percent. Interpolated months land on thirds
 * (36→24 at 5% puts 22 months at 6⅔%), which read better as ⅓/⅔ than 6.67%;
 * the wire value is 4 dp, so the third is matched with a tolerance.
 */
export function formatDiscount(discountPct: number): string {
  const whole = Math.floor(discountPct + 1e-3);
  const fraction = discountPct - whole;
  const thirds = Math.round(fraction * 3);
  if (thirds % 3 !== 0 && Math.abs(fraction * 3 - thirds) < 2e-3) {
    return `${whole || ''}${thirds === 1 ? '⅓' : '⅔'}%`;
  }
  return `${Math.round(discountPct * 100) / 100}%`;
}
