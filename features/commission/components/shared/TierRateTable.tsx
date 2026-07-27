import { formatPercent } from '@/lib/utils/format';

import {
  COMMISSION_TIERS,
  COMMISSION_TIER_LABELS,
  type CommissionTier,
  type TierRates,
} from '../../schemas/commission.schema';
import { RateRow } from './RateRow';

const KNOWN_TIERS = new Set<string>(COMMISSION_TIERS);

/**
 * Renders a tier → rate table.
 *
 * Only tiers actually present are shown: a rate table is not required to
 * define every tier (`topline` ships with founder and associate-pro only), and
 * an absent tier falls back to `default` at resolution time rather than paying
 * zero.
 *
 * Known tiers render in a fixed order so the columns line up between cards;
 * any tier the backend adds later appears after them rather than vanishing.
 */
export function TierRateTable({ rates }: { rates: TierRates }) {
  const known = COMMISSION_TIERS.filter((tier) => rates[tier] !== undefined);
  const unknown = Object.keys(rates)
    .filter((key) => !KNOWN_TIERS.has(key))
    .sort();

  if (known.length === 0 && unknown.length === 0) {
    return <p className="py-1.5 text-sm text-muted-foreground">No rates set</p>;
  }

  return (
    <div>
      {known.map((tier: CommissionTier) => (
        <RateRow key={tier} label={COMMISSION_TIER_LABELS[tier]} value={formatPercent(rates[tier])} />
      ))}
      {unknown.map((tier) => (
        <RateRow key={tier} label={tier} value={formatPercent(rates[tier])} />
      ))}
    </div>
  );
}
