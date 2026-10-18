"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatNaira, formatNairaCompact } from "@/lib/utils/format";

import type { AssetCostItem, CostEventStatus } from "../../schemas/asset-cost.schema";
import type { CostHistoryEntry } from "../../schemas/cost-ledger.schema";
import { DetailPanel } from "./DetailPanel";

const shortDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_LABELS: Record<CostEventStatus, string> = {
  draft: "awaiting approval",
  approved: "approved",
  reversed: "reversed",
  archived: "archived",
};

/* -------------------- how shared cost is distributed -------------------- */

/**
 * One line per cost item saying how it reaches the products. The wording is
 * the backend's own (`allocation_label` on GET .../costs/items), so it always
 * matches the rule profit is actually calculated with. A shared item with no
 * rule yet is flagged, because profit cannot use it until one is set.
 */
export function SharedCostBasisPanel({
  items,
  canManage,
  onSetRule,
}: {
  items: AssetCostItem[];
  canManage: boolean;
  onSetRule: (item: AssetCostItem) => void;
}) {
  const shared = items.filter((item) => item.is_shared);

  return (
    <DetailPanel
      title="How shared cost is distributed"
      description="Current allocation basis for product profitability"
      action={
        canManage && shared.length > 0 ? (
          shared.length === 1 ? (
            <Button variant="outline" size="sm" onClick={() => onSetRule(shared[0])}>
              Edit basis
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit basis
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {shared.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={() => onSetRule(item)}>
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        ) : null
      }
    >
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No cost items yet.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 py-1.5 text-xs">
            <span className="text-muted-foreground">{item.name}</span>
            <b
              className={cn(
                "text-right font-semibold",
                item.needs_allocation_rule && "text-amber-600"
              )}
            >
              {item.is_shared ? (item.allocation_label ?? "No split rule yet") : "Belongs to one product"}
            </b>
          </div>
        ))
      )}
    </DetailPanel>
  );
}

/* -------------------- recent cost changes + full history -------------------- */

function HistoryRow({ entry, exact = false }: { entry: CostHistoryEntry; exact?: boolean }) {
  const { event } = entry;
  const amount =
    event.amount == null ? "Amount not set" : exact ? formatNaira(event.amount) : formatNairaCompact(event.amount);

  return (
    <div className="grid grid-cols-[95px_1fr] gap-3 border-t py-2.5 text-xs first:border-t-0">
      <time className="text-[11px] text-muted-foreground">{shortDate(entry.at)}</time>
      <p>
        <strong className="font-semibold">
          {amount} {event.stage_label.toLowerCase()}
        </strong>
        <small className="mt-0.5 block text-muted-foreground">
          {entry.recordTitle}
          {entry.itemName ? ` · ${entry.itemName}` : ""} · {STATUS_LABELS[event.status]}
          {event.reversal_reason ? ` · ${event.reversal_reason}` : event.note ? ` · ${event.note}` : ""}
        </small>
      </p>
    </div>
  );
}

/** The newest few entries across every record. Reversed entries remain visible with their reason. */
export function RecentCostChangesPanel({
  history,
  onViewAll,
}: {
  history: CostHistoryEntry[];
  onViewAll: () => void;
}) {
  return (
    <DetailPanel
      title="Recent cost changes"
      description="Corrections and reversals keep the earlier entry on record"
      action={
        history.length > 0 ? (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View all
          </Button>
        ) : null
      }
    >
      {history.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Nothing has been recorded yet.</p>
      ) : (
        history.slice(0, 5).map((entry) => <HistoryRow key={entry.event.id} entry={entry} />)
      )}
    </DetailPanel>
  );
}

/** "Cost history" — every entry on every record, newest first. */
export function CostHistorySheet({
  history,
  open,
  onOpenChange,
}: {
  history: CostHistoryEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Cost history</SheetTitle>
          <SheetDescription>
            Every amount recorded against this estate&apos;s costs, newest first. {history.length.toLocaleString()}{" "}
            {history.length === 1 ? "entry" : "entries"}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing has been recorded yet.</p>
          ) : (
            history.map((entry) => <HistoryRow key={entry.event.id} entry={entry} exact />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
