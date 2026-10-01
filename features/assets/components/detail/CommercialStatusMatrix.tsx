"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { useInventoryReconciliation } from "../../hooks/use-inventory-reconciliation";

/**
 * Sold/defaulted by size, straight off the commercial (Analytics) side of
 * the reconciliation join. Deliberately by-size only — no product dimension
 * exists anywhere in this codebase (confirmed repeatedly), so a per-product
 * breakdown is out of scope until that's decided.
 */
export function CommercialStatusMatrix({ assetId }: { assetId: string }) {
  const { data, isLoading } = useInventoryReconciliation(assetId);

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-20 w-full" />
      </section>
    );
  }

  const rows = data.rows.filter((row) => row.commercial !== null);

  return (
    <section className="rounded-xl border">
      <div className="border-b px-4 py-3 sm:px-6">
        <h2 className="font-medium">Commercial status</h2>
        <p className="text-xs text-muted-foreground">
          Sold and defaulted, by size — by-product breakdown isn&apos;t available yet.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No sales data recorded for this estate.</div>
      ) : (
        <div className="divide-y">
          {rows.map((row) => (
            <div key={row.size} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              <span className="text-sm font-medium">{row.size} sqm</span>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>{row.commercial!.units_sold} sold · {formatNaira(row.commercial!.sold_value)}</span>
                <span>{row.commercial!.sqm_sold.toLocaleString()} sqm sold</span>
                {row.commercial!.defaulted_count > 0 ? (
                  <span className="text-rose-600">
                    {row.commercial!.defaulted_count} defaulted · {formatNaira(row.commercial!.defaulted_value)}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
