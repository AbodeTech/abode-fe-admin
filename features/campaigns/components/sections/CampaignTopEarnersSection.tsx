"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";

function displayName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}

function EarnerList({
  title,
  rows,
}: {
  title: string;
  rows: CampaignDashboard["top_earners"]["buyers"];
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <ul className="divide-y">
          {rows.map((earner) => (
            <li key={earner.user_id} className="flex items-center justify-between py-2 text-sm">
              <span>{displayName(earner.first_name, earner.last_name)}</span>
              <span className="tabular-nums text-muted-foreground">
                {earner.rewards} reward{earner.rewards === 1 ? "" : "s"} · {earner.total_sqm.toLocaleString()}{" "}
                sqm
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CampaignTopEarnersSection({
  data,
  isLoading,
}: {
  data?: CampaignDashboard["top_earners"];
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Top earners</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <EarnerList title="Buyers" rows={data?.buyers ?? []} />
        <EarnerList title="Referrers" rows={data?.referrers ?? []} />
      </CardContent>
    </Card>
  );
}
