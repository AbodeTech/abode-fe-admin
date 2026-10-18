"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { RewardType } from "../../schemas/campaign.schema";
import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";
import { formatCount, formatSqm, personName, rewardNoun } from "../../utils/format-metrics";

type Earner = CampaignDashboard["top_earners"]["buyers"][number];

/** The BE sends ten a side; five keeps the card level with the rest of the page. */
const COLLAPSED_ROWS = 5;

function EarnerList({
  title,
  rows,
  rewardType,
  expanded,
}: {
  title: string;
  rows: Earner[];
  rewardType: RewardType;
  expanded: boolean;
}) {
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">None yet.</p>
      ) : (
        <ol className="divide-y divide-border">
          {visible.map((earner, index) => (
            <li key={earner.user_id} className="flex min-w-0 items-center gap-3 py-2.5">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/users/${earner.user_id}`}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {personName(earner.first_name, earner.last_name)}
                </Link>
                {earner.email ? <p className="truncate text-xs text-muted-foreground">{earner.email}</p> : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm tabular-nums text-foreground">
                  {formatCount(earner.rewards)} {rewardNoun(rewardType, earner.rewards)}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">{formatSqm(earner.total_sqm)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CampaignTopEarnersSection({
  data,
  rewardType,
  isLoading,
}: {
  data?: CampaignDashboard["top_earners"];
  rewardType: RewardType;
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  const longest = Math.max(data?.buyers.length ?? 0, data?.referrers.length ?? 0);

  return (
    <Card className="min-w-0 gap-0 border-border bg-card py-0 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-0 pt-5">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">Top earners</CardTitle>
          <p className="text-sm text-muted-foreground">Ranked by rewards earned, then land bought or referred</p>
        </div>
        {longest > COLLAPSED_ROWS ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "Show top 5" : `Show top ${longest}`}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-6 p-5 md:grid-cols-2">
        <EarnerList title="Buyers" rows={data?.buyers ?? []} rewardType={rewardType} expanded={expanded} />
        <EarnerList title="Referrers" rows={data?.referrers ?? []} rewardType={rewardType} expanded={expanded} />
      </CardContent>
    </Card>
  );
}
