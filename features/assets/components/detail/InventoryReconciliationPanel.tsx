"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import type { ReconciliationException } from "../../schemas/inventory-reconciliation.schema";
import { useInventoryReconciliation } from "../../hooks/use-inventory-reconciliation";

/** Both prompt review of the plot register; an unsold recorded plot is normal stock. */
const ACTIONABLE_EXCEPTION_CODES = new Set(["NO_PHYSICAL_PLOTS", "OVERSOLD"]);

/**
 * The physical (Block/Plot) vs. live sale-plan join, by size — a
 * deliberately partial reconciliation (no product dimension exists on either
 * side). Exceptions are computed once, server-side, and surfaced here
 * prominently rather than buried in a table cell — that's the whole point
 * of this view.
 */
export function InventoryReconciliationPanel({ assetId }: { assetId: string }) {
  const { data, isLoading, isError } = useInventoryReconciliation(assetId);

  if (isError) {
    return <section className="rounded-xl border p-6 text-sm text-destructive">Could not load inventory reconciliation.</section>;
  }

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </section>
    );
  }

  const allExceptions = data.rows.flatMap((row) => row.exceptions);
  const totals = data.estate_totals;

  return (
    <section className="rounded-xl border">
      <div className="border-b px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-medium">Inventory reconciliation</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Recorded plots against live sales, grouped by size. Sold units can be awaiting physical allocation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b bg-muted/20 px-4 py-3 text-sm sm:px-6">
        <span>
          <span className="font-medium tabular-nums">{totals.physical_plot_count}</span>{" "}
          <span className="text-muted-foreground">
            plots · {totals.ground_confirmed_count} ground confirmed · {totals.physical_sqm.toLocaleString()} sqm
            physical
          </span>
        </span>
        <span>
          <span className="font-medium tabular-nums">{totals.commercial_units_sold}</span>{" "}
          <span className="text-muted-foreground">
            sold · {totals.commercial_sqm_sold.toLocaleString()} sqm · {formatNaira(totals.commercial_sold_value)}
          </span>
        </span>
        {totals.exception_count > 0 ? (
          <Badge variant="outline" className="text-rose-600">
            {totals.exception_count} review item{totals.exception_count === 1 ? "" : "s"} across the estate
          </Badge>
        ) : (
          <Badge variant="outline" className="text-emerald-600">
            No plot-register gaps found
          </Badge>
        )}
      </div>

      {data.warnings.length > 0 || allExceptions.length > 0 ? (
        <div className="space-y-1 border-b border-amber-200 bg-amber-500/5 px-4 py-3 sm:px-6">
          {data.warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {warning}
            </p>
          ))}
          {allExceptions.map((exception: ReconciliationException) => (
            <p key={exception.message} className="flex items-start justify-between gap-2 text-xs text-amber-700">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {exception.message}
              </span>
              {ACTIONABLE_EXCEPTION_CODES.has(exception.code) ? (
                <Button asChild variant="outline" size="sm" className="h-6 shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100">
                  <a href="#blocks-manager">Manage plots</a>
                </Button>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}

      {data.rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No sizes recorded on either side yet.</div>
      ) : (
        <div className="divide-y">
          {data.rows.map((row) => (
            <div key={row.size} className="grid gap-3 px-4 py-3 sm:grid-cols-2 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {row.size} sqm — Physical
                </p>
                {row.physical ? (
                  <p className="text-sm">
                    {row.physical.allocated_count} system allocated · {row.physical.ground_confirmed_count} ground
                    confirmed · {row.physical.available_count} available · {row.physical.total_sqm.toLocaleString()}{" "}
                    sqm
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No plots recorded</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {row.size} sqm — Commercial
                </p>
                {row.commercial ? (
                  <p className="text-sm">
                    {row.commercial.units_sold} sold · {formatNaira(row.commercial.sold_value)}
                    {row.commercial.defaulted_count > 0 ? (
                      <Badge variant="outline" className="ml-2 text-[10px] text-rose-600">
                        {row.commercial.defaulted_count} defaulted
                      </Badge>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No sales data</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
        <p>
          <span className="font-medium text-foreground">System allocated</span> means a plot&apos;s status was set the
          moment it was bound to a payment plan — a database fact, not a site visit.{" "}
          <span className="font-medium text-foreground">Ground confirmed</span> is a separate, independent count: a
          on-site report for that specific plot, verified by an admin — open a plot&apos;s ground-confirmation
          badge on the Plot Inventory panel above to submit or verify one. A plot can be system allocated without
          ever being ground confirmed.{" "}
          <span className="font-medium text-foreground">Commercial</span> (sold/defaulted, right column) comes from a
          separate sales record. A sold unit may await plot allocation; only sales beyond the total number of
          recorded plots at that size raise a shortage warning above.
        </p>
      </div>

      <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        As of {new Date(data.as_of).toLocaleString("en-NG")}
      </div>
    </section>
  );
}
