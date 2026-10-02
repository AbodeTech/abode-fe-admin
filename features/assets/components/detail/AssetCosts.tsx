"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNairaCompact } from "@/lib/utils/format";

import { useCostCoverage } from "../../hooks/use-cost-coverage";
import { useArchiveCostItem } from "../../hooks/use-cost-items";
import { useCostLedger } from "../../hooks/use-cost-ledger";
import type { AssetCostItem } from "../../schemas/asset-cost.schema";
import { AddCostModal } from "./AddCostModal";
import { AllocationRuleDialog } from "./AllocationRuleDialog";
import { AssetCostsTable } from "./AssetCostsTable";
import { CostHistorySheet, RecentCostChangesPanel, SharedCostBasisPanel } from "./CostActivityPanels";
import { DetailPanel } from "./DetailPanel";
import { ReviseCostModal } from "./ReviseCostModal";

function Metric({ label, value, note }: { label: string; value: number | null; note: string }) {
  return (
    <div className="px-4 py-3.5">
      <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {/* No approved entry at this stage is unknown, not ₦0. */}
      <strong className="text-base font-semibold tabular-nums">{value == null ? "—" : formatNairaCompact(value)}</strong>
      <small className="mt-1 block text-[10px] text-muted-foreground">{note}</small>
    </div>
  );
}

/**
 * The Costs tab, in the asset-detail design's order:
 *
 *   summary strip → what is still unknown → the cost table →
 *   how shared cost is distributed | recent cost changes
 *
 * `useCostLedger` supplies every figure (see `cost-ledger.schema.ts` for how
 * a budget, commitment, incurred cost and payment are added up per cost
 * item). The "still unknown" notice is the backend's own coverage report
 * (GET .../costs/coverage): cost items with nothing recorded, shared items
 * with no split rule, and entries waiting for approval.
 *
 * Profit lives on the Performance tab and the Overview; this tab is costs.
 */
export function AssetCosts({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_costs");
  const canManage = permissions.has("manage_asset_costs");
  const canApprove = permissions.has("approve_asset_costs");

  const ledger = useCostLedger(assetId, { enabled: canView });
  const { data: coverage } = useCostCoverage(assetId, { enabled: canView });

  const [addCostOpen, setAddCostOpen] = useState(false);
  const [addCostItemId, setAddCostItemId] = useState<string | undefined>(undefined);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [ruleItem, setRuleItem] = useState<AssetCostItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [removingItem, setRemovingItem] = useState<AssetCostItem | null>(null);
  const archiveItem = useArchiveCostItem(assetId);

  /** Opens the one "Add cost" form, optionally with a cost item already chosen. */
  function addCost(costItemId?: string) {
    setAddCostItemId(costItemId);
    setAddCostOpen(true);
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view asset costs.</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can grant the view_asset_costs permission.</p>
        </CardContent>
      </Card>
    );
  }

  if (ledger.error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading costs</h3>
        <p>{ledger.error.message}</p>
      </div>
    );
  }

  if (ledger.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const { rows, totals, history } = ledger;
  const items = rows.map((row) => row.item);

  const incomplete = coverage?.items.filter((item) => !item.complete) ?? [];
  const awaiting = coverage?.totals.entries_awaiting_approval ?? 0;
  const firstGap = incomplete[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 divide-y overflow-hidden rounded-lg border bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
        <Metric label="Approved budget" value={totals.budget} note="Across all cost items" />
        <Metric label="Committed" value={totals.committed} note="Contracts and approved work" />
        <Metric label="Incurred" value={totals.incurred} note="Recognised cost — what profit uses" />
        <Metric
          label="Paid"
          value={totals.paid}
          note={
            totals.paid != null && totals.incurred
              ? `${((totals.paid / totals.incurred) * 100).toFixed(1)}% of incurred cost`
              : "Payments made"
          }
        />
        <Metric
          label="Forecast remaining"
          value={totals.remaining}
          note={
            totals.withoutBudget > 0
              ? `Plus ${totals.withoutBudget} with no budget`
              : "Budget still to be incurred"
          }
        />
      </div>

      {ledger.truncated ? (
        <p className="text-xs text-amber-700">
          This estate has more than 100 cost records. The figures here cover the newest 100.
        </p>
      ) : null}

      {incomplete.length > 0 || awaiting > 0 ? (
        <aside className="flex flex-col items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 sm:flex-row">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0">
            <strong className="block text-[13px] font-semibold">
              {incomplete.length > 0
                ? `${incomplete.length} cost${incomplete.length === 1 ? " is" : "s are"} still unknown`
                : `${awaiting} ${awaiting === 1 ? "entry is" : "entries are"} waiting for approval`}
            </strong>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {incomplete.length > 0
                ? `${incomplete
                    .slice(0, 3)
                    .map((item) => `${item.name}: ${item.gaps.join("; ")}`)
                    .join(". ")}.${incomplete.length > 3 ? ` And ${incomplete.length - 3} more.` : ""} `
                : ""}
              {incomplete.length > 0 && awaiting > 0
                ? `${awaiting} ${awaiting === 1 ? "entry is" : "entries are"} also waiting for approval. `
                : ""}
              Profitability stays provisional until these are settled.
            </p>
          </div>
          {canManage && firstGap ? (
            <button
              type="button"
              onClick={() => addCost(firstGap.cost_item_id)}
              className="shrink-0 whitespace-nowrap text-xs font-medium hover:underline sm:ml-auto"
            >
              Add {firstGap.name.toLowerCase()} cost →
            </button>
          ) : null}
        </aside>
      ) : null}

      <DetailPanel
        title="Asset costs"
        description="Manage budgets, commitments, actual costs and payments without changing historical sales"
        flush
        action={
          <>
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              Cost history
            </Button>
            {canManage ? (
              <Button size="sm" onClick={() => addCost()}>
                Add cost
              </Button>
            ) : null}
          </>
        }
      >
        <AssetCostsTable
          rows={rows}
          canManage={canManage}
          onOpenRecord={setOpenRecordId}
          onAddRecord={addCost}
          onRemoveItem={setRemovingItem}
        />
      </DetailPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <SharedCostBasisPanel items={items} canManage={canManage} onSetRule={setRuleItem} />
        <RecentCostChangesPanel history={history} onViewAll={() => setHistoryOpen(true)} />
      </div>

      <AddCostModal
        assetId={assetId}
        open={addCostOpen}
        onOpenChange={(open) => {
          setAddCostOpen(open);
          if (!open) setAddCostItemId(undefined);
        }}
        initialItemId={addCostItemId}
      />

      <ReviseCostModal
        assetId={assetId}
        obligationId={openRecordId}
        open={openRecordId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenRecordId(null);
        }}
        canManage={canManage}
        canApprove={canApprove}
      />

      <AllocationRuleDialog
        assetId={assetId}
        item={ruleItem}
        open={ruleItem !== null}
        onOpenChange={(open) => {
          if (!open) setRuleItem(null);
        }}
      />

      <AlertDialog open={removingItem !== null} onOpenChange={(open) => !open && setRemovingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove the cost item “{removingItem?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Nothing has been recorded on it, so no figure changes. It leaves this table and stops being
              reported as a missing cost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveItem.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={archiveItem.isPending}
              onClick={() => {
                if (!removingItem) return;
                archiveItem.mutate(removingItem.id, {
                  onSuccess: () => {
                    toast.success("Cost item removed");
                    setRemovingItem(null);
                  },
                  onError: (err: Error) => toast.error(err.message),
                });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CostHistorySheet history={history} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
