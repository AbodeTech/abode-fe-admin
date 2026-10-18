"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNairaCompact, formatPercent } from "@/lib/utils/format";

import type { RewardType } from "../../schemas/campaign.schema";
import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";
import type { CampaignRevenue } from "../../schemas/revenue.schema";
import { formatCount, formatSqm, rewardNoun } from "../../utils/format-metrics";

/** Past this many assets the tail folds into one "Other" row rather than growing the card. */
const MAX_ROWS = 6;

type Row = {
  key: string;
  href: string | null;
  name: string;
  purchases: number;
  sqm: number;
  share: number;
  rewards: number;
  value: number | null;
};

export function AssetBreakdownCard({
  assets,
  revenue,
  rewardType,
  isLoading,
}: {
  assets?: CampaignDashboard["assets"];
  revenue?: CampaignRevenue["assets"];
  rewardType: RewardType;
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;

  const valueById = new Map((revenue ?? []).map((row) => [row.asset_id, row.value_sold]));
  const all: Row[] = (assets ?? []).map((asset) => ({
    key: asset.asset_id,
    href: `/assets/${asset.asset_id}`,
    name: asset.asset_name ?? "Unnamed asset",
    purchases: asset.purchases,
    sqm: asset.sqm_sold,
    share: asset.share,
    rewards: asset.rewards,
    value: revenue ? valueById.get(asset.asset_id) ?? 0 : null,
  }));

  const rows = all.length > MAX_ROWS ? all.slice(0, MAX_ROWS - 1) : all;
  if (all.length > MAX_ROWS) {
    const tail = all.slice(MAX_ROWS - 1);
    rows.push({
      key: "other",
      href: null,
      name: `${tail.length} other assets`,
      purchases: tail.reduce((sum, row) => sum + row.purchases, 0),
      sqm: tail.reduce((sum, row) => sum + row.sqm, 0),
      share: tail.reduce((sum, row) => sum + row.share, 0),
      rewards: tail.reduce((sum, row) => sum + row.rewards, 0),
      value: revenue ? tail.reduce((sum, row) => sum + (row.value ?? 0), 0) : null,
    });
  }

  return (
    <Card className="h-full min-w-0 gap-0 border-border bg-card py-0 shadow-none">
      <CardHeader className="px-5 pb-0 pt-5">
        <CardTitle className="text-base font-semibold">Land sold by asset</CardTitle>
        <p className="text-sm text-muted-foreground">Share of the campaign&apos;s land, largest first</p>
      </CardHeader>
      <CardContent className="p-5">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No purchases in the campaign window yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.key} className="space-y-1.5">
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="min-w-0 truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">
                      {row.name}
                    </span>
                  )}
                  <span className="shrink-0 text-sm tabular-nums text-foreground">
                    {formatSqm(row.sqm)}
                    <span className="ml-1.5 text-muted-foreground">{formatPercent(row.share, 0)}</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(row.share > 0 ? 1 : 0, row.share * 100)}%`,
                      backgroundColor: "var(--chart-2)",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCount(row.purchases)} {row.purchases === 1 ? "purchase" : "purchases"} ·{" "}
                  {formatCount(row.rewards)} {rewardNoun(rewardType, row.rewards)}
                  {row.value != null ? ` · ${formatNairaCompact(row.value)} value` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
