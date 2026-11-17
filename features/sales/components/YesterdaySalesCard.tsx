"use client";

import Link from "next/link";
import { format, subDays } from "date-fns";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesDashboard, useSalesKpis } from "../hooks/use-sales";
import { summariseYesterday, type DayChange, type SaleTypeKey } from "../lib/yesterday-sales";

/** Same hue per type as the summary cards below, so a colour means one thing on this page. */
const TYPE_COLOR: Record<SaleTypeKey, string> = {
  flex: "bg-blue-500",
  full_ownership: "bg-green-500",
  commercial: "bg-purple-500",
  other: "bg-gray-400",
};

const ymd = (d: Date) => format(d, "yyyy-MM-dd");
/** Whole naira: plan prices and payments are naira integers, so ".00" is only noise here. */
const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const sqm = (value: number) => `${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })} sqm`;

function ChangeLine({ change, dayBeforeLabel }: { change: DayChange; dayBeforeLabel: string }) {
  if (change.direction === "flat") {
    return (
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="size-4" aria-hidden />
        Same as {dayBeforeLabel}
      </p>
    );
  }
  const up = change.direction === "up";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-sm">
      <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-green-700" : "text-red-700")}>
        <Icon className="size-4" aria-hidden />
        {formatNairaCompact(Math.abs(change.amount))}
        {change.percent !== null && ` (${Math.abs(change.percent).toFixed(0)}%)`}
      </span>
      <span className="text-muted-foreground">
        {up ? "more" : "less"} than {dayBeforeLabel}
      </span>
    </p>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-16 rounded-md" />
      <Skeleton className="h-16 rounded-md" />
    </div>
  );
}

/**
 * Yesterday's new sales, shown whatever the page filters are (super admins).
 *
 * Data, all summed server-side:
 * - GET /admin/sales/dashboard for yesterday → sold (plan prices) and
 *   collected (what those plans have paid so far, not only yesterday's cash);
 * - the same endpoint for the day before → the comparison line;
 * - GET /admin/sales/analytics/kpis for yesterday → buyers and land sold.
 * The card itself only compares and proportions those figures.
 */
export function YesterdaySalesCard() {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const dayBefore = subDays(today, 2);
  const day = ymd(yesterday);
  const prev = ymd(dayBefore);

  const current = useSalesDashboard({ startDate: day, endDate: day });
  const previous = useSalesDashboard({ startDate: prev, endDate: prev });
  const kpis = useSalesKpis({ startDate: day, endDate: day });

  const summary = current.data ? summariseYesterday(current.data, previous.data) : null;
  const dayBeforeLabel = format(dayBefore, "EEEE");
  const noSales = summary !== null && summary.sold === 0;

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <div className="flex min-w-0 flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-sm font-semibold">
          Yesterday&apos;s sales
          <span className="ml-2 font-normal text-muted-foreground">{format(yesterday, "EEE d MMM yyyy")}</span>
        </h2>
        <Link
          href={`/sales?start_date=${day}&end_date=${day}&page=1`}
          className="group inline-flex w-fit items-center gap-1 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          See the records
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <div className="px-4 py-5 sm:px-6">
        {current.isLoading ? (
          <CardSkeleton />
        ) : current.error || !summary ? (
          <p className="text-sm text-muted-foreground">
            Yesterday&apos;s figures couldn&apos;t be loaded. Refresh the page to try again.
          </p>
        ) : noSales ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">No new sales yesterday.</span>
            {previous.data &&
              (previous.data.overall.total > 0
                ? ` ${dayBeforeLabel} sold ${naira(previous.data.overall.total)}.`
                : ` ${dayBeforeLabel} had none either.`)}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:divide-x">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Sold</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums wrap-break-word">
                  {naira(summary.sold)}
                </p>
                {summary.change && (
                  <div className="mt-1">
                    <ChangeLine change={summary.change} dayBeforeLabel={dayBeforeLabel} />
                  </div>
                )}
              </div>

              <div className="min-w-0 md:pl-6">
                <Stat
                  label="Collected on these sales"
                  value={naira(summary.collected)}
                  hint={
                    summary.collectedShare !== null
                      ? `${summary.collectedShare.toFixed(0)}% of the sale value so far`
                      : undefined
                  }
                />
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-4 md:pl-6">
                <Stat
                  label="Buyers"
                  value={kpis.isLoading ? "…" : kpis.data ? kpis.data.unique_buyers.toLocaleString() : "—"}
                />
                <Stat
                  label="Land sold"
                  value={kpis.isLoading ? "…" : kpis.data ? sqm(kpis.data.sqm_sold) : "—"}
                />
              </div>
            </div>

            {summary.split.length > 0 && (
              <div className="space-y-2.5 border-t pt-4">
                <div
                  className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={summary.split
                    .map((t) => `${t.label} ${t.share.toFixed(0)}%`)
                    .join(", ")}
                >
                  {summary.split.map((t) => (
                    <div
                      key={t.key}
                      className={cn("h-full first:rounded-l-full last:rounded-r-full", TYPE_COLOR[t.key])}
                      style={{ width: `${t.share}%` }}
                    />
                  ))}
                </div>
                <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                  {summary.split.map((t) => (
                    <li key={t.key} className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", TYPE_COLOR[t.key])} aria-hidden />
                      <span className="text-muted-foreground">{t.label}</span>
                      <span className="font-medium tabular-nums">{naira(t.value)}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{t.share.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
