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

const HISTORY_DATA = [
  {
    month: "Jan",
    expected: 45000000,
    received: 42000000,
    efficiency: 93,
    activeTxns: 120,
    totalDefaults: 7,
    flexDefaults: 5,
    foDefaults: 2,
    flexDefaultedValue: 8500000,
    foDefaultedValue: 4200000,
    flexOutstandingBalance: 3100000,
    foOutstandingBalance: 1800000,
  },
  {
    month: "Feb",
    expected: 52000000,
    received: 48000000,
    efficiency: 92,
    activeTxns: 135,
    totalDefaults: 9,
    flexDefaults: 6,
    foDefaults: 3,
    flexDefaultedValue: 11200000,
    foDefaultedValue: 6300000,
    flexOutstandingBalance: 4800000,
    foOutstandingBalance: 2900000,
  },
  {
    month: "Mar",
    expected: 48000000,
    received: 44000000,
    efficiency: 91,
    activeTxns: 128,
    totalDefaults: 11,
    flexDefaults: 8,
    foDefaults: 3,
    flexDefaultedValue: 14600000,
    foDefaultedValue: 5800000,
    flexOutstandingBalance: 6200000,
    foOutstandingBalance: 2400000,
  },
].reverse(); // Most recent first for table

const FORECAST_DATA = [
  { month: "Apr", forecast: 61000000 },
  { month: "May", forecast: 55000000 },
  { month: "Jun", forecast: 67000000 },
  { month: "Jul", forecast: 72000000 },
  { month: "Aug", forecast: 68000000 },
  { month: "Sep", forecast: 75000000 },
  { month: "Oct", forecast: 82000000 },
  { month: "Nov", forecast: 88000000 },
  { month: "Dec", forecast: 95000000 },
];

const chartConfig = {
  forecast: {
    label: "Expected Earnings",
    color: "oklch(var(--primary))",
  },
} satisfies ChartConfig;

export function RevenueTimeline() {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(val);
  };

  const formatCurrencyFull = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold tracking-tight">Revenue Forecast</h3>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
            Forward Looking
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Projected earnings for the remainder of the 2025 calendar year.
        </p>
      </div>

      <div className="h-87.5 w-full mt-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FORECAST_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="fillForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
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
                dataKey="forecast"
                fill="url(#fillForecast)"
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
          <p className="text-xs text-muted-foreground italic">
            * Active collection metrics exclude defaulted and terminated contracts.
          </p>
        </div>

        <div className="rounded-xl border bg-background overflow-x-auto shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              {/* Group header row */}
              <TableRow className="border-b-0">
                <TableHead colSpan={6} className="py-2" />
                <TableHead
                  colSpan={3}
                  className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-rose-600 border-l"
                >
                  Defaults
                </TableHead>
                <TableHead
                  colSpan={2}
                  className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-600 border-l"
                >
                  Defaulted Asset Value
                </TableHead>
                <TableHead
                  colSpan={2}
                  className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-orange-600 border-l"
                >
                  Outstanding Balance
                </TableHead>
              </TableRow>
              {/* Column header row */}
              <TableRow>
                <TableHead className="font-bold py-3 whitespace-nowrap">Month</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Expected</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Received</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Efficiency</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Active Txns</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Status</TableHead>
                {/* Defaults group */}
                <TableHead className="font-bold whitespace-nowrap border-l">Total</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Flex</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Full Own.</TableHead>
                {/* Defaulted value group */}
                <TableHead className="font-bold whitespace-nowrap border-l">Flex</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Full Own.</TableHead>
                {/* Outstanding balance group */}
                <TableHead className="font-bold whitespace-nowrap border-l">Flex</TableHead>
                <TableHead className="font-bold whitespace-nowrap">Full Own.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HISTORY_DATA.map((data) => (
                <TableRow key={data.month} className="hover:bg-muted/10">
                  <TableCell className="font-bold py-4 whitespace-nowrap">{data.month} 2025</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">₦{data.expected.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-emerald-600 whitespace-nowrap">₦{data.received.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-bold tabular-nums",
                      data.efficiency > 90 ? "text-emerald-600" : "text-blue-600"
                    )}>
                      {data.efficiency}%
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{data.activeTxns}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                      Closed
                    </Badge>
                  </TableCell>

                  {/* Defaults */}
                  <TableCell className="border-l">
                    <span className="font-bold tabular-nums text-rose-600">{data.totalDefaults}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-50 px-1.5 py-0">
                        F
                      </Badge>
                      <span className="font-semibold tabular-nums text-rose-500">{data.flexDefaults}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase border-green-200 text-green-700 bg-green-50 hover:bg-green-50 px-1.5 py-0">
                        FO
                      </Badge>
                      <span className="font-semibold tabular-nums text-rose-500">{data.foDefaults}</span>
                    </div>
                  </TableCell>

                  {/* Defaulted asset value */}
                  <TableCell className="border-l whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Flex</span>
                      <span className="font-semibold tabular-nums text-amber-600">{formatCurrencyFull(data.flexDefaultedValue)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Full Own.</span>
                      <span className="font-semibold tabular-nums text-amber-600">{formatCurrencyFull(data.foDefaultedValue)}</span>
                    </div>
                  </TableCell>

                  {/* Outstanding balance */}
                  <TableCell className="border-l whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Flex</span>
                      <span className="font-semibold tabular-nums text-orange-600">{formatCurrencyFull(data.flexOutstandingBalance)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Full Own.</span>
                      <span className="font-semibold tabular-nums text-orange-600">{formatCurrencyFull(data.foOutstandingBalance)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
