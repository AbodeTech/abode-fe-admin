"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  COST_GROUPS,
  COST_GROUP_LABELS,
  COST_SOURCE_TYPE_LABELS,
  type AssetCostItem,
  type AssetCostObligation,
  type CostGroup,
} from "../../schemas/asset-cost.schema";
import { AllocationBadge } from "./AllocationRuleDialog";

/**
 * The cost-item → cost-record grouped table — the real 3-layer model's
 * catalogue view. Unlike the old flat "one record, five stage columns"
 * table, a list row here carries no dollar figure (the real `GET .../costs`
 * list endpoint doesn't return one — only `GET .../costs/:obligationId`
 * does, via its embedded events); open a record to see its recognised cost
 * and full stage history.
 */

const STATUS_TONE: Record<AssetCostObligation["status"], string> = {
  open: "bg-muted text-muted-foreground",
  settled: "bg-emerald-500/10 text-emerald-600",
  reversed: "bg-rose-500/10 text-rose-600",
  archived: "bg-muted text-muted-foreground",
};

interface Props {
  items: AssetCostItem[];
  obligations: AssetCostObligation[];
  canManage: boolean;
  onSelectObligation: (obligation: AssetCostObligation) => void;
  onAddObligation: (costItemId: string) => void;
  onAddItem: (group: CostGroup) => void;
  onSetAllocationRule: (item: AssetCostItem) => void;
}

export function AssetCostGroupTable({
  items,
  obligations,
  canManage,
  onSelectObligation,
  onAddObligation,
  onAddItem,
  onSetAllocationRule,
}: Props) {
  const [collapsed, setCollapsed] = useState<CostGroup[]>([]);
  const isOpen = (group: CostGroup) => !collapsed.includes(group);
  const toggle = (group: CostGroup) =>
    setCollapsed((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));

  const groups = COST_GROUPS.map((group) => ({ group, items: items.filter((item) => item.group === group) })).filter(
    (entry) => entry.items.length > 0 || true
  );

  const obligationsFor = (itemId: string) => obligations.filter((o) => o.cost_item.id === itemId);

  return (
    <div className="space-y-3">
      {groups.map(({ group, items: groupItems }) => {
        const open = isOpen(group);
        return (
          <Fragment key={group}>
            <div className="overflow-hidden rounded-xl border">
              <div className="flex w-full items-center gap-2 bg-muted/20 px-4 py-2.5 sm:px-6">
                <button
                  type="button"
                  onClick={() => toggle(group)}
                  aria-expanded={open}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {open ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                  <span className="text-xs font-bold uppercase tracking-widest">{COST_GROUP_LABELS[group]}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{groupItems.length} item{groupItems.length === 1 ? "" : "s"}</span>
                </button>
                {canManage ? (
                  <Button type="button" size="sm" variant="outline" className="ml-2" onClick={() => onAddItem(group)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add item
                  </Button>
                ) : null}
              </div>

              {open ? (
                groupItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No cost items in this group yet.</div>
                ) : (
                  <div className="divide-y">
                    {groupItems.map((item) => {
                      const itemObligations = obligationsFor(item.id);
                      return (
                        <div key={item.id} className="px-4 py-3 sm:px-6">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{item.name}</span>
                              {!item.is_active ? (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Archived
                                </Badge>
                              ) : null}
                              <AllocationBadge item={item} onClick={() => onSetAllocationRule(item)} />
                            </div>
                            {canManage ? (
                              <div className="flex items-center gap-1.5">
                                {item.is_shared ? (
                                  <Button type="button" size="sm" variant="ghost" onClick={() => onSetAllocationRule(item)}>
                                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                                    Allocation
                                  </Button>
                                ) : null}
                                <Button type="button" size="sm" variant="outline" onClick={() => onAddObligation(item.id)}>
                                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                                  Add cost
                                </Button>
                              </div>
                            ) : null}
                          </div>

                          {itemObligations.length === 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">No cost records against this item yet.</p>
                          ) : (
                            <ul className="mt-2 space-y-1.5">
                              {itemObligations.map((obligation) => (
                                <li key={obligation.id}>
                                  <button
                                    type="button"
                                    onClick={() => onSelectObligation(obligation)}
                                    className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-left hover:bg-muted/20"
                                  >
                                    <span className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-sm">{obligation.title}</span>
                                      {obligation.source_type !== "manual" ? (
                                        <Badge variant="outline" className="text-[10px]">
                                          {COST_SOURCE_TYPE_LABELS[obligation.source_type]}
                                        </Badge>
                                      ) : null}
                                    </span>
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_TONE[obligation.status]}`}>
                                      {obligation.status}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
