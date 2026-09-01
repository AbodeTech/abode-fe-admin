"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { formatPeriod } from "../../utils/format-period";
import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";

export function CampaignPeriodSection({
  data,
  isLoading,
}: {
  data?: CampaignDashboard["period"];
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-28 w-full" />;
  if (!data) return null;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Period</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-lg font-semibold">{formatPeriod(data.start_date, data.end_date)}</p>
        <p className="text-sm text-muted-foreground">
          {data.has_ended ? "Ended" : `${data.days_remaining} days remaining`}
        </p>
      </CardContent>
    </Card>
  );
}
