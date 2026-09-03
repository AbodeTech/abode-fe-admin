"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";

export function CampaignIssuanceTimelineChart({
  data,
  isLoading,
}: {
  data?: CampaignDashboard["timeline"];
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Issuance timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">No rewards issued yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="rewards" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
