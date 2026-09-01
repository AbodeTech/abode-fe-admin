"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";

export function CampaignParticipantsSection({
  data,
  isLoading,
}: {
  data?: CampaignDashboard["participants"];
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-28 w-full" />;
  if (!data) return null;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xl font-bold tabular-nums">{data.total_recipients}</div>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div>
          <div className="text-xl font-bold tabular-nums">{data.buyer_recipients}</div>
          <p className="text-xs text-muted-foreground">Buyers</p>
        </div>
        <div>
          <div className="text-xl font-bold tabular-nums">{data.referrer_recipients}</div>
          <p className="text-xs text-muted-foreground">Referrers</p>
        </div>
      </CardContent>
    </Card>
  );
}
