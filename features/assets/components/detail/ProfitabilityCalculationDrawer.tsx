"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, TriangleAlert } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useProfitabilityDrillDown } from "../../hooks/use-profitability-drilldown";
import { OFFER_TYPE_LABELS, type OfferType } from "../../schemas/asset.schema";
import { planTenorLabel } from "../../schemas/asset-analytics.schema";
import { COST_GROUP_LABELS, type AllocationBasis } from "../../schemas/asset-cost.schema";
import {
  calculationBreakdown,
  type DrillDownCostRow,
  type RevenueByProduct,
} from "../../schemas/profitability-drilldown.schema";

const productName = (offerType: string) => OFFER_TYPE_LABELS[offerType as OfferType] ?? offerType;

/** How a shared cost was divided, as the end of the sentence "Split …". */
const SPLIT_PHRASES: Record<AllocationBasis, string> = {
  total_sqm: "by total sqm",
  saleable_sqm: "by saleable sqm",
  product_sqm: "by each product's sqm",
  sqm_sold: "by sqm sold",
  revenue: "by revenue",
  units: "by units",
  equal: "equally",
  manual: "by set percentages",
  amount: "by set amounts",
  direct: "to one product",
};

/* -------------------- 1. the sum -------------------- */

function SumLine({
  sign,
  label,
  hint,
  value,
  total = false,
  valueClass,
}: {
  sign?: "−" | "=";
  label: string;
  hint: string;
  value: string;
  total?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 px-4 py-2.5", total && "border-t bg-muted/40")}>
      <span className="w-3 shrink-0 text-sm text-muted-foreground" aria-hidden>
        {sign ?? ""}
      </span>
      <div className="min-w-0 flex-1">
        <span className={cn("text-sm", total && "font-semibold")}>{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <span className={cn("shrink-0 text-sm tabular-nums", total && "font-semibold", valueClass)}>{value}</span>
    </div>
  );
}

/* -------------------- 2. revenue -------------------- */

function RevenueProduct({ product, sizeLabel }: { product: RevenueByProduct; sizeLabel: (sizeId: string | null) => string }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/40"
      >
        <Chevron className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">{productName(product.offer_type)}</span>
          <span className="block text-[11px] text-muted-foreground">
            {product.units.toLocaleString()} unit{product.units === 1 ? "" : "s"} sold · {formatNaira(product.received)} collected so far
          </span>
        </div>
        <span className="shrink-0 text-sm tabular-nums">{formatNaira(product.sold_value)}</span>
      </button>

      {open ? (
        <div className="space-y-1 border-t bg-muted/20 py-2 pl-10 pr-4">
          {product.lines.map((line, index) => (
            <div key={`${line.size_id}-${line.tenor_months}-${index}`} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                {sizeLabel(line.size_id)}
                {line.tenor_months != null ? ` · ${planTenorLabel(line.tenor_months)}` : ""} · {line.units.toLocaleString()} unit
                {line.units === 1 ? "" : "s"}
              </span>
              <span className="tabular-nums">{formatNaira(line.sold_value)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------- 3. costs -------------------- */

function CostItem({ row }: { row: DrillDownCostRow }) {
  const charged = row.shares.reduce((sum, share) => sum + share.amount, 0);
  const split = row.shares.length > 1;

  return (
    <div className="border-b px-4 py-2.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-medium">{row.name}</span>
          <span className="ml-2 text-[11px] text-muted-foreground">{COST_GROUP_LABELS[row.group]}</span>
        </div>
        <span className="shrink-0 text-sm tabular-nums">{formatNaira(charged)}</span>
      </div>

      {split ? (
        <>
          <p className="mt-1 text-[11px] text-muted-foreground">Split {row.basis ? SPLIT_PHRASES[row.basis] : "across products"}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {row.shares.map((share) => (
              <span key={share.offer_type} className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums">
                {productName(share.offer_type)} {share.share_pct.toFixed(share.share_pct % 1 === 0 ? 0 : 1)}% ·{" "}
                {formatNaira(share.amount)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-1 text-[11px] text-muted-foreground">
          All charged to {row.shares[0] ? productName(row.shares[0].offer_type) : "one product"}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  total,
  children,
}: {
  title: string;
  hint: string;
  total?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {total ? <span className="shrink-0 text-sm font-semibold tabular-nums">{total}</span> : null}
      </div>
      <div className="overflow-hidden rounded-lg border">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-4 text-center text-xs text-muted-foreground">{children}</p>;
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "View calculation" — how the estate's profit figure is arrived at, read top
 * to bottom: the answer first, then where each line of it comes from.
 *
 *   1. The sum          forecast revenue − direct cost − shared cost = profit
 *   2. Not counted      costs left out, and why (only when there are any)
 *   3. Revenue          each product's sales; open one for its sizes and plans
 *   4. Direct costs     each cost charged to one product
 *   5. Shared costs     each cost split across products, with every slice
 *   6. Per square metre total cost over the estate's land
 *
 * All of it is GET .../profitability/drill-down; the only other read is the
 * asset itself, to turn a size id into "300 sqm". The words match the
 * "Profitability by product" table that opens this drawer, so a figure seen
 * there can be found here under the same name. `calculationBreakdown` does
 * the sorting into those sections and is the only place figures are added.
 */
export function ProfitabilityCalculationDrawer({ assetId, open, onOpenChange }: Props) {
  const { data, isLoading, error } = useProfitabilityDrillDown(assetId, undefined, { enabled: open });
  const { data: asset } = useAssetDetail(assetId);

  const sizeSqm = new Map<string, number>();
  for (const offer of asset?.offers ?? []) {
    for (const size of offer.sizes) sizeSqm.set(size._id, size.size_sqm);
  }
  const sizeLabel = (sizeId: string | null) => {
    if (!sizeId) return "No size";
    const sqm = sizeSqm.get(sizeId);
    return sqm != null ? `${sqm.toLocaleString()} sqm` : "Size no longer listed";
  };

  const breakdown = data ? calculationBreakdown(data) : null;
  const totals = data?.subtotals;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>How the profit is worked out</SheetTitle>
          <SheetDescription>
            {data
              ? `${data.asset.name} · figures as of ${new Date(data.as_of).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Every figure behind the profit, from sales to costs."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {error ? (
            <p className="text-sm text-rose-600">Couldn&apos;t load the calculation: {error.message}</p>
          ) : isLoading || !data || !breakdown || !totals ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <SumLine label="Forecast revenue" hint="The sold value of every sale" value={formatNaira(totals.revenue)} />
                <SumLine
                  sign="−"
                  label="Direct cost"
                  hint="Costs charged to one product"
                  value={formatNaira(breakdown.directTotal)}
                />
                <SumLine
                  sign="−"
                  label="Shared cost"
                  hint="Costs split across several products"
                  value={formatNaira(breakdown.sharedTotal)}
                />
                <SumLine
                  sign="="
                  label="Gross profit"
                  hint={
                    totals.margin_pct == null
                      ? "No revenue yet, so there is no margin"
                      : `${totals.margin_pct.toFixed(1)}% margin — profit as a share of revenue`
                  }
                  value={formatNaira(totals.net_profit)}
                  valueClass={totals.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"}
                  total
                />
              </div>

              {breakdown.uncounted.length > 0 ? (
                <aside className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <strong className="block text-[13px] font-semibold">
                        {breakdown.uncounted.length} cost{breakdown.uncounted.length === 1 ? " is" : "s are"} not in this
                        profit figure
                      </strong>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        They are unknown, not zero — the real profit is lower by whatever they turn out to be.
                      </p>
                      <ul className="mt-2 space-y-1">
                        {breakdown.uncounted.map((row) => (
                          <li key={row.cost_item_id} className="text-xs">
                            <span className="font-medium">{row.name}</span>
                            <span className="text-muted-foreground"> — {row.warning ?? "not counted"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/assets/${assetId}/costs`}
                      className="shrink-0 whitespace-nowrap text-xs font-medium hover:underline"
                    >
                      Fix on Costs →
                    </Link>
                  </div>
                </aside>
              ) : null}

              <Section
                title="Forecast revenue"
                hint="By product. Open one to see its sizes and payment plans."
                total={formatNaira(totals.revenue)}
              >
                {breakdown.revenue.length === 0 ? (
                  <Empty>No sales on this estate yet.</Empty>
                ) : (
                  breakdown.revenue.map((product) => (
                    <RevenueProduct key={product.offer_type} product={product} sizeLabel={sizeLabel} />
                  ))
                )}
              </Section>

              <Section
                title="Direct costs"
                hint="Each one belongs to a single product."
                total={formatNaira(breakdown.directTotal)}
              >
                {breakdown.direct.length === 0 ? (
                  <Empty>No cost is charged to a single product.</Empty>
                ) : (
                  breakdown.direct.map((row) => <CostItem key={row.cost_item_id} row={row} />)
                )}
              </Section>

              <Section
                title="Shared costs"
                hint="Each one is divided between products, by the rule shown."
                total={formatNaira(breakdown.sharedTotal)}
              >
                {breakdown.shared.length === 0 ? (
                  <Empty>No cost is split across products.</Empty>
                ) : (
                  breakdown.shared.map((row) => <CostItem key={row.cost_item_id} row={row} />)
                )}
              </Section>

              <Section title="Cost per square metre" hint="Direct and shared cost together, over the estate's land.">
                <div className="grid grid-cols-2 divide-x">
                  <div className="px-4 py-3">
                    <span className="block text-[11px] text-muted-foreground">Per sqm of the whole estate</span>
                    <span className="text-sm font-semibold tabular-nums">{formatNaira(totals.cost_per_total_sqm)}</span>
                  </div>
                  <div className="px-4 py-3">
                    <span className="block text-[11px] text-muted-foreground">Per saleable sqm</span>
                    <span className="text-sm font-semibold tabular-nums">{formatNaira(totals.cost_per_saleable_sqm)}</span>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
