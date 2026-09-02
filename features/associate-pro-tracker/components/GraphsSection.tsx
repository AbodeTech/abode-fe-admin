"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNairaCompact } from "@/lib/utils/format";

import { useTrackerDashboard } from "../hooks/use-tracker-dashboard";
import type { DailyPoint, Series } from "../schemas/tracker.schema";

const revenueConfig = {
  value: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const conversionConfig = {
  new_signups: { label: "New signups", color: "var(--chart-1)" },
  user_to_associate_pro: { label: "User → Pro", color: "var(--chart-2)" },
  associate_to_associate_pro: { label: "Associate → Pro", color: "var(--chart-3)" },
} satisfies ChartConfig;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * Both charts are daily series across the selected year.
 *
 * `average` is over days the YEAR has run, not over days that reported data, so
 * a quiet stretch pulls it down rather than being skipped — that's why a series
 * with few points can still show a low average.
 */
export function GraphsSection({ year }: { year: number }) {
  const { data, isLoading } = useTrackerDashboard(year);

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[240px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;
  const { revenue_graph: revenue, conversion_graph: conversion } = data.graphs;

  // The three conversion series share a date axis, so they merge into one row
  // set keyed by date rather than being drawn from three separate arrays.
  const conversionRows = mergeSeries({
    new_signups: conversion.new_signups.chart_data,
    user_to_associate_pro: conversion.user_to_associate_pro.chart_data,
    associate_to_associate_pro: conversion.associate_to_associate_pro.chart_data,
  });

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Trends</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <SeriesSummary series={revenue} money />
          </CardHeader>
          <CardContent>
            {revenue.chart_data.length === 0 ? (
              <EmptyChart label={`No revenue recorded in ${year}`} />
            ) : (
              <ChartContainer config={revenueConfig} className="h-[240px] w-full">
                <AreaChart data={revenue.chart_data} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tickFormatter={shortDate}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={58}
                    tickFormatter={(value: number) => formatNairaCompact(value)}
                  />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={shortDate} />} />
                  <Area
                    dataKey="value"
                    type="monotone"
                    stroke="var(--color-value)"
                    fill="var(--color-value)"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <p className="text-xs text-muted-foreground tabular-nums">
              {conversion.new_signups.total.toLocaleString()} signups ·{" "}
              {conversion.user_to_associate_pro.total.toLocaleString()} from users ·{" "}
              {conversion.associate_to_associate_pro.total.toLocaleString()} from associates
            </p>
          </CardHeader>
          <CardContent>
            {conversionRows.length === 0 ? (
              <EmptyChart label={`No conversion activity in ${year}`} />
            ) : (
              <ChartContainer config={conversionConfig} className="h-[240px] w-full">
                <LineChart data={conversionRows} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tickFormatter={shortDate}
                  />
                  <YAxis tickLine={false} axisLine={false} width={38} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={shortDate} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {(
                    [
                      "new_signups",
                      "user_to_associate_pro",
                      "associate_to_associate_pro",
                    ] as const
                  ).map((key) => (
                    <Line
                      key={key}
                      dataKey={key}
                      type="monotone"
                      stroke={`var(--color-${key})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SeriesSummary({ series, money = false }: { series: Series; money?: boolean }) {
  const fmt = (value: number) =>
    money ? formatNairaCompact(value) : value.toLocaleString();

  return (
    <p className="text-xs text-muted-foreground tabular-nums">
      {fmt(series.total)} total · {fmt(series.average)}/day
      {series.peak ? ` · peak ${fmt(series.peak.value)} on ${shortDate(series.peak.date)}` : ""}
    </p>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Three date-keyed series into one row set, with gaps as 0 so lines stay continuous. */
function mergeSeries(series: Record<string, DailyPoint[]>) {
  const byDate = new Map<string, Record<string, number | string>>();

  for (const [key, points] of Object.entries(series)) {
    for (const point of points) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[key] = point.value;
      byDate.set(point.date, row);
    }
  }

  const keys = Object.keys(series);
  return [...byDate.values()]
    .map((row) => {
      for (const key of keys) if (row[key] == null) row[key] = 0;
      return row;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
