import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatNaira, formatPercent } from '@/lib/utils/format';

import type { CommissionConfig } from '../../schemas/commission.schema';
import { COMMISSION_LEG_LABELS } from '../../schemas/commission.schema';
import { RateRow } from '../shared/RateRow';
import { TierRateTable } from '../shared/TierRateTable';

/**
 * The `default` step at the bottom of the resolution chain — what applies when
 * no override matches.
 *
 * Uses most of the config, so it takes the whole entity rather than a `Pick`
 * of nine fields.
 */
export function RatesCard({ config }: { config: CommissionConfig }) {
  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-2">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Flex commission</CardTitle>
          <CardDescription>
            Paid to the direct referrer on every flex payment. Flex has no upline or topline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TierRateTable rates={config.flexCommission.direct} />
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Full ownership commission</CardTitle>
          <CardDescription>
            Direct, plus one and two levels up the referral chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <p className="text-sm font-medium">{COMMISSION_LEG_LABELS.direct}</p>
            <div className="ml-2">
              <TierRateTable rates={config.fullOwnershipCommission.direct} />
            </div>
          </section>

          <Separator />

          <section>
            <p className="text-sm font-medium">{COMMISSION_LEG_LABELS.upline}</p>
            <div className="ml-2">
              <TierRateTable rates={config.fullOwnershipCommission.upline} />
            </div>
          </section>

          <Separator />

          <section>
            <p className="text-sm font-medium">{COMMISSION_LEG_LABELS.topline}</p>
            <div className="ml-2">
              <TierRateTable rates={config.fullOwnershipCommission.topline} />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Platform rates</CardTitle>
          <CardDescription>Applied across every commission event.</CardDescription>
        </CardHeader>
        <CardContent>
          <RateRow label="Withholding tax" value={formatPercent(config.wht_rate)} />
          <RateRow
            label="Marketplace platform fee"
            value={formatPercent(config.marketplace_platform_fee_pct)}
          />
          <RateRow
            label="Upgrade commission"
            value={formatPercent(config.upgrade_commission_pct)}
          />
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Amounts</CardTitle>
          <CardDescription>Fixed fees and thresholds, in naira.</CardDescription>
        </CardHeader>
        <CardContent>
          <RateRow
            label="Associate Pro upgrade fee"
            value={formatNaira(config.associate_pro_fee)}
          />
          <RateRow
            label="High commission alert"
            value={formatNaira(config.high_commission_alert_threshold)}
          />

          <Separator className="my-2" />

          <RateRow label="Active version" value={`v${config.version}`} />
          <RateRow
            label="Published"
            value={
              config.updatedAt
                ? new Date(config.updatedAt).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
