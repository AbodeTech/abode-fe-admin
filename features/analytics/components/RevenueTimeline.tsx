"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSalesMonthlyTimeline, type SalesAnalyticsFilters } from "@/features/analytics";

const chartConfig = {
  expectedRevenue: {
    label: "Expected Revenue",
    color: "oklch(var(--primary))",
  },
} satisfies ChartConfig;

interface RevenueTimelineProps {
  filters: SalesAnalyticsFilters;
}

export function RevenueTimeline({ filters }: RevenueTimelineProps) {
  const { data, isLoading, error } = useSalesMonthlyTimeline(filters);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val || 0);
  };

  const formatCurrencyFull = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (isLoading) {
    return <div className="h-[360px] w-full animate-pulse bg-muted rounded-xl mx-6 mt-6" />;
  }

  if (error) {
    return (
      <div className="mx-6 mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
        <h3 className="font-semibold">Unable to load revenue timeline</h3>
        <p className="text-sm">{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const timeline = data || [];

  return (
    <div className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold tracking-tight">Monthly Revenue Timeline</h3>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
            Live Data
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Month-over-month expected and collected revenue based on selected filters.
        </p>
      </div>

      <div className="h-87.5 w-full mt-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="fillExpectedRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCurrency}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="expectedRevenue"
                fill="url(#fillExpectedRevenue)"
                stroke="oklch(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "oklch(var(--primary))", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold tracking-tight">Collection Performance History</h3>
        </div>

        <div className="rounded-xl border bg-background overflow-x-auto shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-3 whitespace-nowrap">Month</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Expected Revenue</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Total Due</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Total Received</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Efficiency</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Active Txns</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Missed</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Defaulted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeline.length > 0 ? (
                timeline.map((row) => {
                  const totalDue = Number(row?.totalDue || 0);
                  const totalReceived = Number(row?.totalReceived || 0);
                  const efficiency = totalDue > 0 ? Math.round((totalReceived / totalDue) * 100) : 0;

                  return (
                    <TableRow key={row?.month} className="hover:bg-muted/10">
                      <TableCell className="font-bold py-4 whitespace-nowrap">{row?.month || "-"}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatCurrencyFull(Number(row?.expectedRevenue || 0))}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatCurrencyFull(totalDue)}</TableCell>
                      <TableCell className="font-bold text-emerald-600 whitespace-nowrap">{formatCurrencyFull(totalReceived)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            efficiency >= 80 ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {efficiency}%
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{Number(row?.activeTransactions || 0)}</TableCell>
                      <TableCell>
                        <span className="font-semibold tabular-nums text-amber-600">{Number(row?.missedPaymentCount || 0)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold tabular-nums text-rose-600">{Number(row?.defaultedCount || 0)}</span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No monthly timeline data available for current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
