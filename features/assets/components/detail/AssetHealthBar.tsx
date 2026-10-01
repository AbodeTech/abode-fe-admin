"use client";

import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import type { AssetAnalyticsResponse, LifecycleBucket } from "../../schemas/asset-analytics.schema";

const percent = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

function Metric({
  label,
  value,
  note,
  noteClass,
}: {
  label: string;
  value: string;
  note: string;
  noteClass?: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong className="text-base font-semibold tabular-nums">{value}</strong>
      <small className={cn("mt-1 block text-[10px] text-muted-foreground", noteClass)}>{note}</small>
    </div>
  );
}

function HealthValue({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-semibold tabular-nums", valueClass)}>{value}</div>
    </div>
  );
}

/**
 * One side of the defaults / terminations block. `landLabel` is the design's
 * third figure ("Land retained" / "Land released"); the analytics endpoint
 * reports these buckets in customers, plans and naira only — no sqm — so it
 * is drawn as an em-dash rather than left out or guessed.
 */
function LifecycleSide({
  title,
  bucket,
  valueLabel,
  landLabel,
  tone,
}: {
  title: string;
  bucket: LifecycleBucket;
  valueLabel: string;
  landLabel: string;
  tone: "bad" | "warn";
}) {
  const text = tone === "bad" ? "text-rose-600" : "text-amber-600";

  return (
    <div className={cn("p-4", tone === "bad" ? "bg-rose-500/5" : "bg-amber-500/5")}>
      <div className={cn("mb-3 text-[10px] font-bold uppercase tracking-wider", text)}>
        {title} · {bucket.customers.toLocaleString()} customer{bucket.customers === 1 ? "" : "s"}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HealthValue label={valueLabel} value={formatNairaCompact(bucket.value)} />
        <HealthValue label="Outstanding balance" value={formatNairaCompact(bucket.amount_owing)} valueClass={text} />
        <HealthValue label={landLabel} value="—" />
      </div>
    </div>
  );
}

/**
 * The slice of `GET /admin/assets/:id/analytics` this panel reads. A contract,
 * not a fetch shape — the tab passes the response straight through.
 */
type AssetHealth = Pick<
  AssetAnalyticsResponse,
  | "total_inventory_value"
  | "total_realised"
  | "remaining_value"
  | "total_capacity_sqm"
  | "sqm_sold"
  | "sqm_remaining"
  | "efficiency_rate"
  | "active_customers"
  | "total_customers"
  | "defaulting"
  | "terminated"
>;

/**
 * The Performance tab's top panel, in three bands as the design draws it:
 *
 *  1. Summary strip — starting inventory value, cash realised (and what share
 *     of the starting value that is), remaining value, sqm sold (and what
 *     share of capacity), sqm remaining.
 *  2. Defaults and terminations — how many customers, the asset value tied up
 *     in those plans, and what is still owed on them.
 *  3. Customer health — active / defaulted / terminated as shares of all
 *     customers, plus collection efficiency.
 *
 * Every figure is read as-is from the analytics response; the only arithmetic
 * here is turning two of its numbers into a percentage.
 */
export function AssetHealthBar({ data }: { data: AssetHealth }) {
  const { defaulting, terminated } = data;

  // `total_customers` is the BE's own all-time figure, not active + defaulted +
  // terminated: a customer can sit in more than one bucket across plans, so
  // summing the three would over-count and push the bar past 100%.
  const share = (count: number) => percent(count, data.total_customers);
  const activePct = share(data.active_customers);
  const defaultedPct = share(defaulting.customers);
  const terminatedPct = share(terminated.customers);

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-1 divide-y bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
        <Metric
          label="Starting inventory"
          value={formatNairaCompact(data.total_inventory_value)}
          note="Current product pricing"
        />
        <Metric
          label="Total realized"
          value={formatNairaCompact(data.total_realised)}
          note={`${percent(data.total_realised, data.total_inventory_value).toFixed(1)}% sold`}
          noteClass="font-semibold text-emerald-600"
        />
        <Metric label="Remaining value" value={formatNairaCompact(data.remaining_value)} note="Current unsold value" />
        <Metric
          label="Total sqm sold"
          value={data.sqm_sold.toLocaleString()}
          note={`${percent(data.sqm_sold, data.total_capacity_sqm).toFixed(1)}% of capacity`}
        />
        <Metric label="Sqm remaining" value={data.sqm_remaining.toLocaleString()} note="Available inventory" />
      </div>

      <div className="grid grid-cols-1 border-t md:grid-cols-2 md:divide-x">
        <LifecycleSide
          title="Defaults"
          bucket={defaulting}
          valueLabel="Defaulted asset value"
          landLabel="Land retained"
          tone="bad"
        />
        <LifecycleSide
          title="Terminations"
          bucket={terminated}
          valueLabel="Terminated value"
          landLabel="Land released"
          tone="warn"
        />
      </div>

      <div className="border-t p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customer health</div>
        <div
          className="my-2 flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Active ${activePct.toFixed(0)}%, defaulted ${defaultedPct.toFixed(0)}%, terminated ${terminatedPct.toFixed(0)}%`}
        >
          <div className="h-full bg-emerald-500" style={{ width: `${activePct}%` }} />
          <div className="h-full bg-rose-500" style={{ width: `${defaultedPct}%` }} />
          <div className="h-full bg-amber-500" style={{ width: `${terminatedPct}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="font-semibold text-emerald-600">
            ● Active {data.active_customers.toLocaleString()} · {activePct.toFixed(0)}%
          </span>
          <span className="font-semibold text-rose-600">
            ● Defaulted {defaulting.customers.toLocaleString()} · {defaultedPct.toFixed(0)}%
          </span>
          <span className="font-semibold text-amber-600">
            ● Terminated {terminated.customers.toLocaleString()} · {terminatedPct.toFixed(0)}%
          </span>
          <span>Collection efficiency {data.efficiency_rate.toFixed(1)}%</span>
        </div>
      </div>
    </section>
  );
}
