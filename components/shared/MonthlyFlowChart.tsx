"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Validated categorical slots from the dataviz skill's reference palette
 * (references/palette.md), as EventMetricsPanel does — the app's own
 * --chart-1..5 tokens fail the CVD and contrast gates. Re-validated for this
 * pair on the light surface: all checks PASS, worst adjacent CVD ΔE 9.2
 * (deutan), normal-vision ΔE 27.6.
 *
 * The green carries a contrast WARN against the surface (2.74:1), which the
 * skill says must be relieved rather than dismissed — hence the value printed
 * above every bar.
 */
export const FLOW_CREATED = "#eb6834";
export const FLOW_RESOLVED = "#1baf7a";

const chartConfig: ChartConfig = {
  created: { label: "Came in", color: FLOW_CREATED },
  resolved: { label: "Resolved", color: FLOW_RESOLVED },
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-09" → "Sep", and "Sep 26" once the window spans a year boundary. */
const monthLabel = (key: string, showYear: boolean) => {
  const [year, month] = key.split("-");
  const name = MONTHS[Number(month) - 1] ?? key;
  return showYear ? `${name} ${year.slice(2)}` : name;
};

export interface MonthlyFlowPoint {
  month: string;
  created: number;
  resolved: number;
}

/**
 * Tickets in against tickets out, by month.
 *
 * The one picture that answers "are we keeping up", which no backlog total can:
 * a backlog conflates "we are drowning" with "we have been drowning since
 * March". Level bars mean holding; the orange bar above the green means the
 * queue grew that month.
 *
 * Deliberately NOT a stacked bar or a dual axis: the two series are different
 * populations of the same unit (a ticket resolved this month usually arrived in
 * an earlier one), so stacking them would total something meaningless, and a
 * second axis would let any pair of numbers be drawn as if they crossed.
 */
export function MonthlyFlowChart({
  points,
  height = "h-56",
}: {
  points: MonthlyFlowPoint[];
  height?: string;
}) {
  const spansYears = new Set(points.map((d) => d.month.slice(0, 4))).size > 1;
  const rows = points.map((d) => ({ ...d, label: monthLabel(d.month, spansYears) }));

  return (
    <ChartContainer config={chartConfig} className={`aspect-auto ${height} w-full`}>
      <BarChart data={rows} margin={{ top: 18, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
        <YAxis tickLine={false} axisLine={false} width={32} className="text-xs" />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <ChartLegend content={<ChartLegendContent />} />
        {/* 4px rounded data-ends anchored to the baseline; the gap between the
            pair is the spacer the mark spec asks for. */}
        <Bar dataKey="created" fill={FLOW_CREATED} radius={[4, 4, 0, 0]} maxBarSize={28}>
          <LabelList dataKey="created" position="top" className="fill-gray-600 text-[10px]" />
        </Bar>
        <Bar dataKey="resolved" fill={FLOW_RESOLVED} radius={[4, 4, 0, 0]} maxBarSize={28}>
          <LabelList dataKey="resolved" position="top" className="fill-gray-600 text-[10px]" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** Resolved ÷ came in over the window. Below 1 the backlog grew. */
export const flowRatio = (points: MonthlyFlowPoint[]) => {
  const inn = points.reduce((s, p) => s + p.created, 0);
  const out = points.reduce((s, p) => s + p.resolved, 0);
  return { totalIn: inn, totalOut: out, ratio: inn === 0 ? null : out / inn };
};
