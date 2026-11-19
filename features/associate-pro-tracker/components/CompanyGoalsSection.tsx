"use client";

import { Banknote, Store, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNaira } from "@/lib/utils/format";

import type { CompanyGoalMetric, TrackerDashboard } from "../schemas/tracker.schema";

type CompanyGoals = NonNullable<TrackerDashboard["company_goals"]>;

/**
 * The three company goals (Admin v2 — Backend Requirements, item 16): unique
 * sellers, average revenue per associate and sales revenue. Rendered only when
 * the BE sends `company_goals`. A goal with no target shows its actual and
 * says the target isn't set, rather than a 0% bar.
 */
export function CompanyGoalsSection({ goals }: { goals: CompanyGoals }) {
  const cards: { key: string; title: string; icon: React.ReactNode; metric: CompanyGoalMetric; format: (n: number) => string }[] = [
    {
      key: "sellers",
      title: "Unique sellers",
      icon: <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />,
      metric: goals.unique_sellers,
      format: (n) => n.toLocaleString(),
    },
    {
      key: "per-associate",
      title: "Average revenue per associate",
      icon: <Store className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />,
      metric: goals.average_revenue_per_associate,
      format: formatNaira,
    },
    {
      key: "revenue",
      title: "Sales revenue",
      icon: <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />,
      metric: goals.financial_revenue,
      format: formatNaira,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map(({ key, title, icon, metric, format }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold tabular-nums">
              {metric.actual === null ? "—" : format(metric.actual)}
              {metric.target !== null && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">of {format(metric.target)}</span>
              )}
            </p>
            {metric.progress_pct !== null ? (
              <div className="space-y-1.5">
                <Progress value={Math.min(100, metric.progress_pct)} />
                <p className="text-xs font-medium tabular-nums text-muted-foreground">
                  {metric.progress_pct.toFixed(1)}% of target{metric.progress_pct >= 100 ? " — met" : ""}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No target set for this year.</p>
            )}
            {metric.previous_year_actual !== null && (
              <p className="text-xs tabular-nums text-muted-foreground">
                Last year: {format(metric.previous_year_actual)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
