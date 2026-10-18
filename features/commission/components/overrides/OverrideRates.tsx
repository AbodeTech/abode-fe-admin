import { formatPercent } from '@/lib/utils/format';

import {
  COMMISSION_LEGS,
  COMMISSION_LEG_LABELS,
  COMMISSION_TIERS,
  COMMISSION_TIER_LABELS,
  type CommissionLeg,
} from '../../schemas/commission.schema';
import type { NormalisedOverride, OverrideRate } from '../../schemas/override.schema';

const KNOWN_TIERS = new Set<string>(COMMISSION_TIERS);

function tierEntries(rates: Record<string, number>): [string, number][] {
  const known = COMMISSION_TIERS.filter((tier) => rates[tier] !== undefined).map(
    (tier) => [COMMISSION_TIER_LABELS[tier], rates[tier]] as [string, number]
  );
  const unknown = Object.keys(rates)
    .filter((key) => !KNOWN_TIERS.has(key))
    .sort()
    .map((key) => [key, rates[key]] as [string, number]);

  return [...known, ...unknown];
}

function LegLine({ leg, rate }: { leg: CommissionLeg; rate: OverrideRate }) {
  if (rate.kind === 'flat') {
    return (
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-muted-foreground">{COMMISSION_LEG_LABELS[leg]}</span>
        <span className="font-medium tabular-nums">{formatPercent(rate.rate)}</span>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{COMMISSION_LEG_LABELS[leg]}</span>
      <div className="ml-2 flex flex-wrap gap-x-3 gap-y-0.5">
        {tierEntries(rate.rates).map(([label, value]) => (
          <span key={label} className="text-xs">
            <span className="text-muted-foreground">{label} </span>
            <span className="font-medium tabular-nums">{formatPercent(value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders whichever legs an override actually defines.
 *
 * An absent leg is not zero — it falls through to the next level of the
 * resolution chain, so it is simply not shown rather than rendered as 0%.
 *
 * Asset overrides carry a rate per tier; user and asset+user overrides carry a
 * single number. Both shapes render here rather than being flattened into one
 * that would misrepresent the other.
 */
export function OverrideRates({ rates }: Pick<NormalisedOverride, 'rates'>) {
  const legs = COMMISSION_LEGS.filter((leg) => rates[leg]);

  if (legs.length === 0) {
    return <span className="text-sm text-muted-foreground">No rates set</span>;
  }

  return (
    <div className="space-y-1">
      {legs.map((leg) => (
        <LegLine key={leg} leg={leg} rate={rates[leg]!} />
      ))}
    </div>
  );
}
