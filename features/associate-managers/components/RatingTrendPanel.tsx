"use client";

import { Loader2, Star } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  useManagerRatingSeries,
  type ManagerRatingSeriesPoint,
} from "../hooks/use-manager-rating-series";

interface Props {
  managerId: string | null;
  enabled?: boolean;
  monthsBack?: number;
  title?: string;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthLabel = (p: ManagerRatingSeriesPoint) =>
  MONTH_LABELS[p.month - 1] ?? String(p.month);

const barColor = (count: number) =>
  count === 0 ? "#E5E7EB" : "#00695C"; // gray-200 when empty, teal otherwise

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ManagerRatingSeriesPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-gray-900">
        {monthLabel(p)} {p.year}
      </p>
      {p.count > 0 ? (
        <p className="text-gray-600">
          Avg <span className="font-semibold">{p.average.toFixed(2)}</span> /
          5.00 · {p.count.toLocaleString()}{" "}
          {p.count === 1 ? "rating" : "ratings"}
        </p>
      ) : (
        <p className="text-gray-500 italic">No ratings this month</p>
      )}
    </div>
  );
}

export function RatingTrendPanel({
  managerId,
  enabled = true,
  monthsBack = 6,
  title = "Rating Trend",
}: Props) {
  const { data, isLoading, error } = useManagerRatingSeries({
    managerId,
    monthsBack,
    enabled,
  });

  const points = data ?? [];
  const hasAny = points.some((p) => p.count > 0);

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50">
            <Star className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">
              Realtor ratings averaged per month · last {monthsBack} months
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading trend…
        </div>
      ) : error ? (
        <div className="h-40 flex items-center justify-center text-red-600 text-sm">
          {(error as Error).message || "Failed to load trend."}
        </div>
      ) : !hasAny ? (
        <div className="h-40 flex flex-col items-center justify-center text-gray-500 text-sm">
          <p>No ratings recorded in the last {monthsBack} months.</p>
          <p className="text-xs mt-1">
            Bars will appear here once your team starts rating.
          </p>
        </div>
      ) : (
        <>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={points}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey={(p: ManagerRatingSeriesPoint) => monthLabel(p)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                />
                <Tooltip cursor={{ fill: "rgba(0, 105, 92, 0.06)" }} content={<ChartTooltip />} />
                <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                  {points.map((p, i) => (
                    <Cell key={i} fill={barColor(p.count)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rating count strip mirrors the x-axis so the reader knows how many
              votes each bar is averaging (a 5.0 on a single rating is very
              different from a 5.0 on twenty). */}
          <div
            className="grid text-center text-[10px] tabular-nums text-gray-500"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          >
            {points.map((p, i) => (
              <span key={i} className={p.count === 0 ? "text-gray-300" : ""}>
                {p.count > 0
                  ? `${p.count} ${p.count === 1 ? "rating" : "ratings"}`
                  : "—"}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
