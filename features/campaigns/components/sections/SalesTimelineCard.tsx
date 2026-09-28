"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { RewardType } from "../../schemas/campaign.schema";
import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";
import { formatCompact, formatCount, formatDayKey, formatSqm, rewardNoun } from "../../utils/format-metrics";

type Day = CampaignDashboard["timeline"][number];
type Grain = "day" | "week";

/** Past this many days, daily bars go hair-thin and spiky — a week reads better. */
const WEEKLY_AFTER_DAYS = 45;

/** Sums days into Monday-start weeks, keyed by the Monday. */
function toWeeks(days: Day[]): Day[] {
  const weeks = new Map<string, Day>();
  for (const day of days) {
    const [year, month, date] = day.date.split("-").map(Number);
    const monday = new Date(Date.UTC(year, month - 1, date));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const week = weeks.get(key) ?? { date: key, purchases: 0, sqm_sold: 0, rewards: 0 };
    week.purchases += day.purchases;
    week.sqm_sold += day.sqm_sold;
    week.rewards += day.rewards;
    weeks.set(key, week);
  }
  return [...weeks.values()];
}

const periodLabel = (grain: Grain, date: string) =>
  grain === "week" ? `Week of ${formatDayKey(date)}` : formatDayKey(date);

function DayTooltip({
  active,
  payload,
  rewardType,
  grain,
}: TooltipProps<number, string> & { rewardType: RewardType; grain: Grain }) {
  if (!active || !payload?.length) return null;
  const day = payload[0].payload as Day;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{periodLabel(grain, day.date)}</p>
      <p className="mt-1 tabular-nums text-foreground">{formatSqm(day.sqm_sold)} sold</p>
      <p className="tabular-nums text-muted-foreground">
        {formatCount(day.purchases)} {day.purchases === 1 ? "purchase" : "purchases"} ·{" "}
        {formatCount(day.rewards)} {rewardNoun(rewardType, day.rewards)}
      </p>
    </div>
  );
}

export function SalesTimelineCard({
  data,
  rewardType,
  isLoading,
}: {
  data?: CampaignDashboard["timeline"];
  rewardType: RewardType;
  isLoading?: boolean;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;

  const grain: Grain = (data?.length ?? 0) > WEEKLY_AFTER_DAYS ? "week" : "day";
  const days = grain === "week" ? toWeeks(data ?? []) : data ?? [];
  const active = days.filter((day) => day.purchases > 0 || day.rewards > 0);
  const best = active.reduce<Day | null>((top, day) => (!top || day.sqm_sold > top.sqm_sold ? day : top), null);

  return (
    <Card className="h-full min-w-0 gap-0 border-border bg-card py-0 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-0 pt-5">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">
            {grain === "week" ? "Weekly land sold" : "Daily land sold"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {best
              ? `Best ${grain}: ${grain === "week" ? "from " : ""}${formatDayKey(best.date)} · ${formatSqm(best.sqm_sold)}`
              : `sqm sold per ${grain} across the campaign`}
          </p>
        </div>
        {days.length > 0 ? (
          <div className="flex shrink-0 rounded-md border border-border p-0.5" role="group" aria-label="View">
            {(["chart", "table"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={view === option ? "secondary" : "ghost"}
                className="h-7 px-2.5 text-xs capitalize"
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-5">
        {days.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            The timeline starts when the campaign does.
          </p>
        ) : view === "chart" ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayKey}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  minTickGap={28}
                />
                <YAxis
                  tickFormatter={(value: number) => formatCompact(value)}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                  content={<DayTooltip rewardType={rewardType} grain={grain} />}
                />
                {/* No grow-in: it would replay on every background refetch. */}
                <Bar
                  dataKey="sqm_sold"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : active.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No purchases yet.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{grain === "week" ? "Week of" : "Day"}</TableHead>
                  <TableHead className="text-right">Land sold</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right capitalize">{rewardNoun(rewardType, 2)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...active].reverse().map((day) => (
                  <TableRow key={day.date}>
                    <TableCell>{formatDayKey(day.date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatSqm(day.sqm_sold)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(day.purchases)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(day.rewards)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
