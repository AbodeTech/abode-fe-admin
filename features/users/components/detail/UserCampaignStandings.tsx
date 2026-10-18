'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNaira } from '@/lib/utils/format';

import type { AdminUserCampaignStanding } from '../../schemas/user-detail.schema';

export function UserCampaignStandings({
  standings,
  isLoading,
}: {
  standings: AdminUserCampaignStanding[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Campaign standings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !standings?.length ? (
          <p className="text-sm text-muted-foreground">No active campaigns.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {standings.map((row, index) => {
              const name =
                (typeof row.campaign.name === 'string' && row.campaign.name) ||
                (typeof row.campaign.title === 'string' && row.campaign.title) ||
                String(row.campaign._id ?? `campaign-${index}`);
              return (
                <li key={name} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{name}</p>
                  <p className="mt-1 text-muted-foreground">
                    Rank {row.rank ?? '—'} · Buyer {row.buyer.rewards} rewards / {row.buyer.total_sqm} sqm
                    · Referrer {row.referrer.rewards} rewards / {row.referrer.total_sqm} sqm
                  </p>
                  <p className="mt-1">
                    {formatNaira(row.total_paid)} paid of {formatNaira(row.total_payable)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
