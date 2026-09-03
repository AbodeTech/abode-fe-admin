"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";

export function CampaignProgressSection({
  data,
  issuance,
  isLoading,
}: {
  data?: CampaignDashboard["progress"];
  issuance?: CampaignDashboard["issuance"];
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;

  const hasTarget = data.total_sqm_target != null && data.total_sqm_target > 0;
  const pct = data.percent != null ? Math.max(0, Math.min(100, data.percent * 100)) : 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasTarget ? (
          <>
            <Progress value={pct} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {data.total_sqm_sold.toLocaleString()} / {data.total_sqm_target!.toLocaleString()} sqm
            </p>
          </>
        ) : (
          <p className="text-sm">
            <span className="text-xl font-bold tabular-nums">{data.total_sqm_sold.toLocaleString()}</span>{" "}
            <span className="text-muted-foreground">sqm sold so far</span>
          </p>
        )}
        {issuance ? (
          <p className="text-sm">
            {issuance.active_rewards === 0
              ? "0 rewards issued so far"
              : `${issuance.active_rewards.toLocaleString()} active rewards`}
            {issuance.invalidated_rewards > 0
              ? ` · ${issuance.invalidated_rewards.toLocaleString()} invalidated`
              : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
