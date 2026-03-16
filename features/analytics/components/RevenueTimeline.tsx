"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  ComposedChart,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const HISTORY_DATA = [
  { month: "Jan", expected: 45000000, received: 42000000, efficiency: 93, activeTxns: 120 },
  { month: "Feb", expected: 52000000, received: 48000000, efficiency: 92, activeTxns: 135 },
  { month: "Mar", expected: 48000000, received: 44000000, efficiency: 91, activeTxns: 128 },
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

      <div className="h-[350px] w-full mt-4">
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
            * Strictly excludes defaulted and terminated contracts.
          </p>
        </div>
        <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-4">Month</TableHead>
                <TableHead className="font-bold">Expected</TableHead>
                <TableHead className="font-bold">Received</TableHead>
                <TableHead className="font-bold">Efficiency</TableHead>
                <TableHead className="font-bold">Active Txns</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HISTORY_DATA.map((data) => (
                <TableRow key={data.month} className="hover:bg-muted/10">
                  <TableCell className="font-bold py-4">{data.month} 2025</TableCell>
                  <TableCell className="font-medium">₦{data.expected.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-emerald-600">₦{data.received.toLocaleString()}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
