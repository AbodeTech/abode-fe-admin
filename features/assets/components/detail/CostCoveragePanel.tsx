"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { COST_GROUPS, COST_GROUP_LABELS, type CostGroup } from "../../schemas/asset-cost.schema";
import type { CostCoverageItem } from "../../schemas/cost-coverage.schema";
import { useCostCoverage } from "../../hooks/use-cost-coverage";

/**
 * "How much of this estate's cost is actually known" — the real
 * `GET .../costs/coverage` endpoint's own framing. Unlike the old panel
 * (missing rows from a fixed suggested-item list), every row here is an
 * EXISTING cost item; a "gap" means it has stages recorded that are
 * unapproved, unknown, or otherwise incomplete — not that the item itself
 * doesn't exist yet.
 */
interface Props {
  assetId: string;
  canManage: boolean;
  onAddObligation: (costItemId: string) => void;
}

export function CostCoveragePanel({ assetId, canManage, onAddObligation }: Props) {
  const { data, isLoading } = useCostCoverage(assetId);
  const [collapsed, setCollapsed] = useState<CostGroup[]>([]);
  const isOpen = (group: CostGroup) => !collapsed.includes(group);
  const toggle = (group: CostGroup) =>
    setCollapsed((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-32 w-full" />
      </section>
    );
  }

  const groups = COST_GROUPS.map((group) => ({
    group,
    rows: data.items.filter((item) => item.group === group),
  })).filter((entry) => entry.rows.length > 0);

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Cost coverage</h2>
          <p className="text-xs text-muted-foreground">
            {data.totals.complete} of {data.totals.items} cost item(s) fully accounted for.
          </p>
        </div>
        <span className="text-sm font-medium tabular-nums">{formatNaira(data.totals.recognised_cost)} recognised</span>
      </div>

      {groups.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No cost items recorded yet.</div>
      ) : (
        groups.map(({ group, rows }) => {
          const open = isOpen(group);
          return (
            <Fragment key={group}>
              <button
                type="button"
                onClick={() => toggle(group)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 border-b bg-muted/20 px-4 py-2.5 text-left sm:px-6"
              >
                {open ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                <span className="text-xs font-bold uppercase tracking-widest">{COST_GROUP_LABELS[group]}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {rows.filter((r) => r.complete).length} complete · {rows.filter((r) => !r.complete).length} incomplete
                </span>
              </button>

              {open
                ? rows.map((row: CostCoverageItem) => (
                    <div key={row.cost_item_id} className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium">{row.name}</span>
                          {row.is_shared ? (
                            <Badge variant="outline" className="text-[10px]">
                              Shared
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {row.complete ? (
                            <span className="text-emerald-600">Fully accounted for</span>
                          ) : (
                            <span>{row.gaps.join("; ")}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs tabular-nums text-muted-foreground">{formatNaira(row.recognised_cost)}</span>
                        {canManage ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => onAddObligation(row.cost_item_id)}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add cost
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                : null}
            </Fragment>
          );
        })
      )}

      {data.totals.entries_awaiting_approval > 0 || data.totals.entries_without_an_amount > 0 ? (
        <div className="border-t bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 sm:px-6">
          {data.totals.entries_awaiting_approval} entry(ies) awaiting approval · {data.totals.entries_without_an_amount} without
          an amount yet.
        </div>
      ) : null}
    </section>
  );
}
