"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useTrackerDashboard } from "../hooks/use-tracker-dashboard";
import type { Funnel } from "../schemas/tracker.schema";

/**
 * The two conversion funnels. Measured live, so this renders with or without a
 * goal for the year.
 *
 * The funnels answer different questions and their denominators are NOT the
 * same pool: user→pro is measured against everyone who signed up in the year,
 * associate→pro against everyone who reached the associate rung in it. Their
 * rates are not comparable to each other, hence the explicit sub-labels.
 */
export function ConversionMetricsSection({ year }: { year: number }) {
  const { data, isLoading } = useTrackerDashboard(year);

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;
  const { conversion_metrics: metrics } = data;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Conversion</h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {metrics.total_associate_pro.toLocaleString()} Associate Pros ·{" "}
          {metrics.overall_conversion_rate.toFixed(1)}% overall
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FunnelCard
          title="User → Associate Pro"
          caption="Of everyone who signed up this year"
          funnel={metrics.user_to_associate_pro}
        />
        <FunnelCard
          title="Associate → Associate Pro"
          caption="Of everyone who reached Associate this year"
          funnel={metrics.associate_to_associate_pro}
        />
      </div>
    </section>
  );
}

function FunnelCard({
  title,
  caption,
  funnel,
}: {
  title: string;
  caption: string;
  funnel: Funnel;
}) {
  const width = Math.min(100, funnel.conversion_rate);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold tabular-nums">
          {funnel.conversion_rate.toFixed(1)}%
        </p>

        {/* The bar is the funnel: converted against the whole pool. */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              width >= 50 ? "bg-emerald-500" : width >= 20 ? "bg-amber-400" : "bg-rose-500"
            )}
            style={{ width: `${width}%` }}
          />
        </div>

        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <dt>Pool</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {funnel.total.toLocaleString()}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Converted</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {funnel.converted.toLocaleString()}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Not yet</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {funnel.not_converted.toLocaleString()}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
