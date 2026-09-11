"use client";

import { CheckCircle2, Landmark, Layers, UserPlus, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

import { useEventAnalytics } from "../hooks/use-event-analytics";
import type { EventAllocation, EventAnalytics } from "../schemas/company-event.schema";

const formatNumber = (value?: number | null) => new Intl.NumberFormat("en-NG").format(value ?? 0);

/*
 * Validated categorical/sequential slots (dataviz skill's reference
 * palette, references/palette.md) — the app's own --chart-1..5 tokens fail
 * the CVD/contrast gates, so this panel uses the pre-validated hexes
 * directly rather than those tokens. Slots 2 (orange) and 3 (aqua) are the
 * eligibility-mix pair; slots 6/7/8 (green/violet/red) are the category-mix
 * set — a separate consecutive triplet (re-validated: all-PASS, no contrast
 * warnings) so it doesn't overlap or visually pair with eligibility's colors.
 */
const PALETTE = {
  sequentialFill: "#2a78d6", // step 450 — reused for the funnel and pickup-load bars
  sequentialTrack: "#b7d3f6", // lighter step of the same ramp
  land: "#eb6834", // slot 2
  landDevLevy: "#1baf7a", // slot 3
  associatePro: "#008300", // slot 6
  associate: "#4a3aa7", // slot 7
  client: "#e34948", // slot 8
};

/**
 * Same card spec as `CohortStatCards` / the meeting-detail stat card
 * (rounded-2xl, soft slate border, icon chip) — reused here rather than the
 * plain shadcn `Card` so this reads as a metric, consistent with every other
 * stat card in the dashboard.
 */
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 truncate text-lg font-bold text-slate-900">{value}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

/** Meter: single ratio against a limit — never a 2-slice pie (dataviz skill). */
function CapacityMeter({
  allocated,
  capacity,
  unit,
}: {
  allocated: number;
  capacity: number | null;
  unit: string;
}) {
  if (capacity == null) {
    return (
      <p className="text-sm text-slate-500">
        {formatNumber(allocated)} {unit} allocated (no capacity set for this event)
      </p>
    );
  }

  const percent = Math.min(100, Math.round((allocated / capacity) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Capacity utilization</span>
        <span className="font-semibold tabular-nums text-slate-900">{percent}%</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: PALETTE.sequentialTrack }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: PALETTE.sequentialFill }}
        />
      </div>
      <p className="text-sm text-slate-500">
        {formatNumber(allocated)} / {formatNumber(capacity)} {unit} allocated
      </p>
    </div>
  );
}

const eligibilityChartConfig: ChartConfig = {
  land: { label: "Land", color: PALETTE.land },
  land_and_dev_levy: { label: "Land + Dev Levy", color: PALETTE.landDevLevy },
};

/**
 * Donut, no in-slice figures — the counts live in the legend below instead.
 * Derived client-side from the allocations already loaded for the Allocated
 * tab (`eligibility_tier` is a real field per row); the analytics endpoint
 * itself has no dedicated aggregate for this split.
 */
function EligibilityMixDonut({ land, landAndDevLevy }: { land: number; landAndDevLevy: number }) {
  const total = land + landAndDevLevy;
  if (total === 0) {
    return <p className="text-sm text-slate-500">No one has been allocated yet.</p>;
  }

  const data = [
    { key: "land", value: land },
    { key: "land_and_dev_levy", value: landAndDevLevy },
  ];

  return (
    <ChartContainer config={eligibilityChartConfig} className="mx-auto aspect-square h-40">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius="58%" outerRadius="100%" strokeWidth={2} stroke="#ffffff">
          {data.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

const funnelChartConfig: ChartConfig = {
  count: { label: "Count", color: PALETTE.sequentialFill },
};

/** Ordered stages, one hue, magnitude comparison — value at each bar's tip. */
function RegistrationFunnelChart({ funnel }: { funnel: EventAnalytics["funnel"] }) {
  const data = [
    { stage: "Allocated", count: funnel.allocated },
    { stage: "Registered", count: funnel.registered },
    { stage: "Checked-in", count: funnel.checked_in },
    { stage: "Confirmed", count: funnel.confirmed },
  ];

  return (
    <ChartContainer config={funnelChartConfig} className="aspect-auto h-40 w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="stage"
          axisLine={false}
          tickLine={false}
          width={80}
          tick={{ fill: "#52514e", fontSize: 12 }}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={22}>
          <LabelList dataKey="count" position="right" fill="#0b0b0b" fontSize={12} fontWeight={600} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const categoryMixChartConfig: ChartConfig = {
  associate_pro: { label: "Associate Pro", color: PALETTE.associatePro },
  associate: { label: "Associate", color: PALETTE.associate },
  client: { label: "Client", color: PALETTE.client },
};

/** Part-to-whole, three categories → a single horizontal stacked bar, not a donut (dataviz skill). */
function CategoryMixChart({ mix }: { mix: EventAnalytics["category_mix"] }) {
  const byCategory = Object.fromEntries(mix.map((m) => [m.category, m.count]));
  const associatePro = byCategory.associate_pro ?? 0;
  const associate = byCategory.associate ?? 0;
  const client = byCategory.client ?? 0;
  const total = associatePro + associate + client;

  if (total === 0) {
    return <p className="text-sm text-slate-500">No one has registered yet.</p>;
  }

  const data = [{ name: "Registered", associate_pro: associatePro, associate, client }];

  return (
    <ChartContainer config={categoryMixChartConfig} className="aspect-auto h-20 w-full">
      <BarChart data={data} layout="vertical" barCategoryGap={0} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid horizontal={false} stroke="transparent" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" hide />
        <Bar dataKey="associate_pro" stackId="mix" fill="var(--color-associate_pro)" radius={[4, 0, 0, 4]} stroke="#ffffff" strokeWidth={2}>
          <LabelList dataKey="associate_pro" position="insideLeft" fill="#ffffff" fontSize={11} fontWeight={600} />
        </Bar>
        <Bar dataKey="associate" stackId="mix" fill="var(--color-associate)" stroke="#ffffff" strokeWidth={2}>
          <LabelList dataKey="associate" position="insideLeft" fill="#ffffff" fontSize={11} fontWeight={600} />
        </Bar>
        <Bar dataKey="client" stackId="mix" fill="var(--color-client)" radius={[0, 4, 4, 0]} stroke="#ffffff" strokeWidth={2}>
          <LabelList dataKey="client" position="insideRight" fill="#ffffff" fontSize={11} fontWeight={600} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const pickupLoadChartConfig: ChartConfig = {
  registered: { label: "Registrations", color: PALETTE.sequentialFill },
};

/** Compare magnitude across categories (locations) — one hue, sorted descending, value at the tip. */
function PickupLocationLoadChart({ locations }: { locations: EventAnalytics["pickup_load"] }) {
  if (locations.length === 0 || locations.every((loc) => loc.registered === 0)) {
    return <p className="text-sm text-slate-500">No registrations yet.</p>;
  }

  const data = [...locations]
    .sort((a, b) => b.registered - a.registered)
    .map((loc) => ({
      ...loc,
      label: loc.seat_limit != null ? `${loc.registered} / ${loc.seat_limit}` : `${loc.registered}`,
    }));

  return (
    <ChartContainer config={pickupLoadChartConfig} className="aspect-auto w-full" style={{ height: Math.max(120, data.length * 36) }}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={110}
          tick={{ fill: "#52514e", fontSize: 12 }}
        />
        <Bar dataKey="registered" fill="var(--color-registered)" radius={[0, 4, 4, 0]} barSize={20}>
          <LabelList dataKey="label" position="right" fill="#0b0b0b" fontSize={12} fontWeight={600} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

interface EventMetricsPanelProps {
  eventId: string;
  /** Real, from the event itself (`toEventDto()`). */
  availableSize: number | null;
  reservedSize: number;
  sizeUnit: string | null;
  /** Real — `meta.total` from the eligible-clients query. */
  eligibleRemainingCount: number;
  /** Already-loaded page of `GET /:id/allocations` (shared with the Allocated tab) — used to tally eligibility mix. */
  allocatedRows: EventAllocation[];
  /** `meta.total` for `allocatedRows` — flags the tally below as partial when the page didn't cover everyone. */
  allocatedTotal: number;
}

export function EventMetricsPanel({
  eventId,
  availableSize,
  reservedSize,
  sizeUnit,
  eligibleRemainingCount,
  allocatedRows,
  allocatedTotal,
}: EventMetricsPanelProps) {
  const { data: analytics, isLoading } = useEventAnalytics(eventId);
  const unit = sizeUnit || "sqm";

  const liveAllocations = allocatedRows.filter((row) => row.status !== "cancelled");
  const land = liveAllocations.filter((row) => row.eligibility_tier === "land").length;
  const landAndDevLevy = liveAllocations.filter((row) => row.eligibility_tier === "land_and_dev_levy").length;
  const eligibilityTallyIsPartial = allocatedTotal > allocatedRows.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Capacity"
          value={availableSize != null ? `${formatNumber(availableSize)} ${unit}` : "—"}
          icon={Landmark}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Allocated"
          value={`${formatNumber(reservedSize)} ${unit}`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Remaining"
          value={availableSize != null ? `${formatNumber(Math.max(0, availableSize - reservedSize))} ${unit}` : "—"}
          icon={Layers}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Eligible remaining"
          value={formatNumber(eligibleRemainingCount)}
          icon={UserPlus}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Land utilization</h3>
        <CapacityMeter allocated={reservedSize} capacity={availableSize} unit={unit} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Eligibility mix (allocated)</h3>
        <EligibilityMixDonut land={land} landAndDevLevy={landAndDevLevy} />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE.land }} />
            Land ({formatNumber(land)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE.landDevLevy }} />
            Land + Dev Levy ({formatNumber(landAndDevLevy)})
          </span>
        </div>
        {eligibilityTallyIsPartial && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Based on the {formatNumber(allocatedRows.length)} of {formatNumber(allocatedTotal)} allocations loaded.
          </p>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : analytics ? (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Registration funnel</h3>
            <RegistrationFunnelChart funnel={analytics.funnel} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">No-show</span>
                <Badge variant="secondary">{formatNumber(analytics.no_show)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Cancelled</span>
                <Badge variant="secondary">{formatNumber(analytics.cancelled)}</Badge>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400">No-show: registered but never checked in for boarding.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Category mix (registered)</h3>
              <CategoryMixChart mix={analytics.category_mix} />
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE.associatePro }} />
                  Associate Pro
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE.associate }} />
                  Associate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PALETTE.client }} />
                  Client
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Pickup-location load</h3>
              <PickupLocationLoadChart locations={analytics.pickup_load} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
