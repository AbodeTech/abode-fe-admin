"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira, formatSqm } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import type { ProfitabilityByProductRow, ProfitabilityBySizeRow } from "../../schemas/estate-profitability.schema";
import { useEstateProfitability } from "../../hooks/use-estate-profitability";

function formatProfitNaira(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatNaira(Math.abs(amount))}`;
}

function formatMarginPercent(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function ProductRow({ row, sizes }: { row: ProfitabilityByProductRow; sizes: ProfitabilityBySizeRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-muted/40 sm:px-6"
      >
        {sizes.length > 0 ? (
          open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )
        ) : (
          <span className="w-4" />
        )}

        <span className="min-w-[10rem] flex-1 text-sm font-medium">{OFFER_TYPE_LABELS[row.offer_type] ?? row.offer_type}</span>

        <span className="w-36 shrink-0 text-right text-sm tabular-nums">{formatNaira(row.revenue)}</span>
        <span className="w-36 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {formatProfitNaira(row.direct_cost)}
        </span>
        <span className="w-36 shrink-0 text-right text-sm font-medium tabular-nums">{formatProfitNaira(row.net_profit)}</span>
        <span className="w-20 shrink-0 text-right text-sm tabular-nums">{formatMarginPercent(row.margin_pct)}</span>
      </button>

      {open && sizes.length > 0 ? (
        <div className="space-y-1.5 border-t bg-muted/20 px-4 py-3 pl-11 sm:px-6">
          {sizes.map((size) => (
            <div key={size.size_id ?? "unassigned"} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
              <span className="min-w-[10rem] flex-1 text-muted-foreground">
                {formatSqm(size.size_sqm)} · {size.units.toLocaleString()} unit(s)
              </span>
              <span className="w-36 shrink-0 text-right tabular-nums">{formatNaira(size.revenue)}</span>
              <span className="w-36 shrink-0 text-right tabular-nums text-muted-foreground">
                {formatProfitNaira(size.direct_cost)}
              </span>
              <span className="w-36 shrink-0 text-right font-medium tabular-nums">{formatProfitNaira(size.net_profit)}</span>
              <span className="w-20 shrink-0 text-right tabular-nums">{formatMarginPercent(size.margin_pct)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface Props {
  assetId: string;
}

/** One row per product, expandable to its own size-by-size split — both sliced from the same real `GET .../profitability` read. */
export function ProductProfitabilityComparison({ assetId }: Props) {
  const { data, isLoading } = useEstateProfitability(assetId);

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </section>
    );
  }

  const sizesByProduct = (offerType: string) => data.by_size.filter((row) => row.offer_type === offerType);

  return (
    <section className="rounded-xl border">
      <div className="border-b px-4 py-3 sm:px-6">
        <h2 className="font-medium">Product profitability comparison</h2>
        <p className="text-xs text-muted-foreground">
          Each product&apos;s revenue against its share of cost — expand a row for its size-by-size split.
        </p>
      </div>

      <div className="hidden items-center gap-x-4 border-b bg-muted/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:flex sm:px-6">
        <span className="w-4" />
        <span className="min-w-[10rem] flex-1">Product</span>
        <span className="w-36 shrink-0 text-right">Revenue</span>
        <span className="w-36 shrink-0 text-right">Direct cost</span>
        <span className="w-36 shrink-0 text-right">Net profit</span>
        <span className="w-20 shrink-0 text-right">Margin</span>
      </div>

      {data.by_product.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">This estate has no offers yet.</div>
      ) : (
        <div>
          {data.by_product.map((row) => (
            <ProductRow key={row.offer_type} row={row} sizes={sizesByProduct(row.offer_type)} />
          ))}
        </div>
      )}

      {data.warnings.length > 0 ? (
        <div className="space-y-1 border-t border-amber-200 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 sm:px-6">
          {data.warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        As of {new Date(data.as_of).toLocaleString("en-NG")}
      </div>
    </section>
  );
}
