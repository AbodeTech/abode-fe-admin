"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { PLOT_STATUS_LABELS } from "../../schemas/block-plot.schema";
import { useInventoryReconciliation } from "../../hooks/use-inventory-reconciliation";

/**
 * "Add the physical-status matrix" — the physical (Block/Plot) counterpart to
 * CommercialStatusMatrix.tsx, straight off the same reconciliation join's
 * `physical` side. Deliberately by-size only, same constraint as its
 * commercial sibling: no product dimension exists on this data yet.
 */
export function PhysicalStatusMatrix({ assetId }: { assetId: string }) {
  const { data, isLoading } = useInventoryReconciliation(assetId);

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-20 w-full" />
      </section>
    );
  }

  const rows = data.rows.filter((row) => row.physical !== null);

  return (
    <section className="rounded-xl border">
      <div className="border-b px-4 py-3 sm:px-6">
        <h2 className="font-medium">Physical status</h2>
        <p className="text-xs text-muted-foreground">
          {PLOT_STATUS_LABELS.allocated} and {PLOT_STATUS_LABELS.available.toLowerCase()} plots, by size — by-product
          breakdown isn&apos;t available yet.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No plots recorded for this estate.</div>
      ) : (
        <div className="divide-y">
          {rows.map((row) => (
            <div key={row.size} className="px-4 py-2.5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium">{row.size} sqm</span>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{row.physical!.allocated_count} {PLOT_STATUS_LABELS.allocated.toLowerCase()}</span>
                  <span>{row.physical!.available_count} {PLOT_STATUS_LABELS.available.toLowerCase()}</span>
                  <span>{row.physical!.total_sqm.toLocaleString()} sqm total</span>
                </div>
              </div>
              {row.physical!.allocated_holders.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 pl-1 text-xs text-muted-foreground">
                  {row.physical!.allocated_holders.map((holder) => (
                    <li key={holder.plot_id} className="flex items-center justify-between gap-2">
                      <span>
                        {holder.plot_name}
                        {holder.customer_name ? ` · ${holder.customer_name}` : ""}
                      </span>
                      {holder.attributable_value != null ? <span>{formatNaira(holder.attributable_value)}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
