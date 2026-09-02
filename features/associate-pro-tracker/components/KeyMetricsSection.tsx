"use client";

import { Award, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { useTrackerDashboard } from "../hooks/use-tracker-dashboard";
import type { TrackerDashboard } from "../schemas/tracker.schema";
import { GoalsNotSetPrompt } from "./GoalsNotSetPrompt";

/**
 * The two goal-dependent cards. This is the only section that swaps for the
 * "goals not set" prompt — everything else on the page is measured live.
 */
export function KeyMetricsSection({ year }: { year: number }) {
  const { data, isLoading } = useTrackerDashboard(year);

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;
  if (!data.goals_set) return <GoalsNotSetPrompt year={year} />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <AssociateProProgressCard progress={data.associate_pro_progress} />
      <RevenueMetricsCard revenue={data.revenue_metrics} />
    </div>
  );
}

/** Percentages can exceed 100 when a target is beaten; the bar caps, the number doesn't. */
function ProgressRow({ percentage }: { percentage: number }) {
  return (
    <div className="space-y-1.5">
      <Progress value={Math.min(100, percentage)} />
      <p className="text-xs font-medium tabular-nums text-muted-foreground">
        {percentage.toFixed(1)}% of target
        {percentage >= 100 ? " — met" : ""}
      </p>
    </div>
  );
}

function AssociateProProgressCard({
  progress,
}: {
  progress: TrackerDashboard["associate_pro_progress"];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Associate Pros
        </CardTitle>
        <Award className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold tabular-nums">
          {/* The BE pre-formats "X of Y" so the two sides can't drift apart. */}
          {progress.progress_text ?? progress.current_associate_pro.toLocaleString()}
        </p>
        {progress.percentage_complete != null ? (
          <ProgressRow percentage={progress.percentage_complete} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function RevenueMetricsCard({
  revenue,
}: {
  revenue: TrackerDashboard["revenue_metrics"];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
        <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold tabular-nums">
          {revenue.progress_text ?? formatNaira(revenue.total_revenue)}
        </p>
        {revenue.percentage_complete != null ? (
          <ProgressRow percentage={revenue.percentage_complete} />
        ) : null}
        {revenue.revenue_remaining != null ? (
          <p className="text-xs tabular-nums text-muted-foreground">
            {revenue.revenue_remaining > 0
              ? `${formatNaira(revenue.revenue_remaining)} to go`
              : "Target reached"}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
