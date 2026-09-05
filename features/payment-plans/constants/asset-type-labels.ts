import type { PaymentPlanAssetType } from '../schemas/payment-plan-row.schema';

/**
 * Display labels for `PAYMENT_PLAN_ASSET_TYPES`. The wire values mix hyphens
 * and underscores (`full-ownership` vs `developer_plot`), so a plain
 * `replace(/_/g, ' ')` leaves half of them looking raw.
 */
export const ASSET_TYPE_LABELS: Record<PaymentPlanAssetType, string> = {
  'co-ownership': 'Co-ownership',
  flex: 'Flex',
  'full-ownership': 'Full ownership',
  'land-banking': 'Land banking',
  commercial: 'Commercial',
  developer_plot: 'Developer plot',
};

/** Asset type as sent by the BE on a row — unknown values are humanised. */
export function assetTypeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return ASSET_TYPE_LABELS[value as PaymentPlanAssetType] ?? value.replace(/[-_]/g, ' ');
}
