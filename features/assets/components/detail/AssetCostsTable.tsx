"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS, type OfferType } from "../../schemas/asset.schema";
import {
  COST_GROUP_LABELS,
  COST_SOURCE_TYPE_LABELS,
  type AssetCostItem,
  type ObligationDetail,
} from "../../schemas/asset-cost.schema";
import { recognisedCost, type CostLedgerRow, type CostRowStatus } from "../../schemas/cost-ledger.schema";

const HEAD =
  "whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left";
const CELL = "whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums";

const STATUS: Record<CostRowStatus, { label: (row: CostLedgerRow) => string; className: string }> = {
  missing: { label: () => "Cost missing", className: "bg-rose-500/10 text-rose-600" },
  pending: { label: (row) => `${row.pending} pending`, className: "bg-amber-500/10 text-amber-600" },
  over_budget: { label: () => "Over budget", className: "bg-rose-500/10 text-rose-600" },
  complete: { label: () => "Complete", className: "bg-emerald-500/10 text-emerald-600" },
  in_progress: { label: () => "In progress", className: "bg-amber-500/10 text-amber-600" },
};

const names = (products: readonly string[]) =>
  products.map((product) => OFFER_TYPE_LABELS[product as OfferType] ?? product).join(", ");

/**
 * Who the cost applies to, in the design's "Scope" column. The backend has no
 * scope field; it has what a cost item is limited to and which product each
 * record is booked against, and this reads those.
 */
function scopeLabel(item: AssetCostItem, records: ObligationDetail[]): string {
  if (item.applies_to_products.length > 0) return names(item.applies_to_products);
  if (item.is_shared) {
    return item.excluded_products.length > 0 ? `All except ${names(item.excluded_products)}` : "Whole asset";
  }
  const booked = [...new Set(records.map((record) => record.obligation.product).filter((p) => p !== null))];
  return booked.length > 0 ? names(booked as string[]) : "—";
}

/** A stage amount: unknown (`null`) is a dash, a real zero is ₦0.00. */
const money = (value: number | null | undefined) => (value == null ? "—" : formatNairaCompact(value));

function Remaining({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">Unknown</span>;
  if (value < 0) return <span className="font-semibold text-rose-600">Over by {formatNairaCompact(-value)}</span>;
  return <>{formatNairaCompact(value)}</>;
}

interface Props {
  rows: CostLedgerRow[];
  canManage: boolean;
  onOpenRecord: (obligationId: string) => void;
  onAddRecord: (costItemId: string) => void;
  /** Asks the parent to confirm removing a cost item that has nothing recorded on it. */
  onRemoveItem: (item: AssetCostItem) => void;
}

/**
 * The Asset costs table — one row per cost item, with the design's columns.
 *
 *  - Budget / Committed / Incurred / Paid   approved amounts at each stage,
 *    added up across the item's records (`costLedger`). "Incurred" is the
 *    recognised cost — the figure the profit calculation uses.
 *  - Remaining forecast   budget minus incurred; "Unknown" with no budget.
 *  - Status   Cost missing (nothing recorded), N pending (entries awaiting
 *    approval, not yet in any figure), Over budget, Complete (fully incurred
 *    and paid), otherwise In progress.
 *
 * The design draws each row as a single record. Here a cost item can hold
 * several, so "View" opens the one record when there is exactly one, and
 * otherwise opens the row to list them; each record opens its own detail.
 *
 * "Remove" is offered only on a cost item with nothing recorded on it. The
 * backend never deletes an item, it marks it inactive, and an inactive item
 * drops out of this table. Doing that to an item that holds records would
 * hide their cost here while profitability went on counting it.
 */
export function AssetCostsTable({ rows, canManage, onOpenRecord, onAddRecord, onRemoveItem }: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (itemId: string) =>
    setExpanded((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));

  if (rows.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        No cost items yet. Use Add cost to set up the first one.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/40">
            <th className={HEAD}>Cost group</th>
            <th className={HEAD}>Scope</th>
            <th className={HEAD}>Budget</th>
            <th className={HEAD}>Committed</th>
            <th className={HEAD}>Incurred</th>
            <th className={HEAD}>Paid</th>
            <th className={HEAD}>Remaining forecast</th>
            <th className={HEAD}>Status</th>
            <th className={HEAD} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { item, records, totals } = row;
            const open = expanded.includes(item.id);
            const status = STATUS[row.status];
            const Chevron = open ? ChevronDown : ChevronRight;

            return (
              <Fragment key={item.id}>
                <tr className="border-b last:border-b-0 hover:bg-muted/40">
                  <td className="px-2.5 py-2.5 text-left">
                    <span className="font-semibold">{item.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {COST_GROUP_LABELS[item.group]}
                      {records.length > 1 ? ` · ${records.length} records` : ""}
                    </span>
                  </td>
                  <td className={cn(CELL, "whitespace-normal")}>{scopeLabel(item, records)}</td>
                  <td className={CELL}>{money(totals.budget)}</td>
                  <td className={CELL}>{money(totals.committed)}</td>
                  <td className={CELL}>{money(totals.incurred)}</td>
                  <td className={CELL}>{money(totals.paid)}</td>
                  <td className={CELL}>
                    <Remaining value={row.remaining} />
                  </td>
                  <td className={CELL}>
                    <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", status.className)}>
                      {status.label(row)}
                    </span>
                  </td>
                  <td className={CELL}>
                    {records.length === 0 ? (
                      canManage ? (
                        <span className="inline-flex items-center gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => onAddRecord(item.id)}>
                            Add
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-rose-600"
                            aria-label={`Remove the cost item ${item.name}`}
                            onClick={() => onRemoveItem(item)}
                          >
                            Remove
                          </Button>
                        </span>
                      ) : null
                    ) : records.length === 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenRecord(records[0].obligation.id)}
                      >
                        View
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-expanded={open}
                        aria-label={`${open ? "Hide" : "View"} records for ${item.name}`}
                        onClick={() => toggle(item.id)}
                      >
                        View
                        <Chevron className="ml-1 h-3.5 w-3.5" aria-hidden />
                      </Button>
                    )}
                  </td>
                </tr>

                {open
                  ? records.map((record) => (
                      <tr
                        key={record.obligation.id}
                        className="cursor-pointer border-b bg-muted/20 hover:bg-muted/40"
                        onClick={() => onOpenRecord(record.obligation.id)}
                      >
                        <td className="py-2 pl-7 pr-2.5 text-left text-muted-foreground">
                          {record.obligation.title}
                          {record.obligation.source_type !== "manual" ? (
                            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                              {COST_SOURCE_TYPE_LABELS[record.obligation.source_type]}
                            </span>
                          ) : null}
                        </td>
                        <td className={CELL}>
                          {record.obligation.product ? names([record.obligation.product]) : "—"}
                        </td>
                        <td className={CELL}>{money(record.stages.budget)}</td>
                        <td className={CELL}>{money(record.stages.committed)}</td>
                        <td className={CELL}>{money(recognisedCost(record))}</td>
                        <td className={CELL}>{money(record.stages.paid)}</td>
                        <td className={CELL} />
                        <td className={cn(CELL, "capitalize text-muted-foreground")}>{record.obligation.status}</td>
                        <td className={cn(CELL, "text-muted-foreground")}>Open</td>
                      </tr>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
