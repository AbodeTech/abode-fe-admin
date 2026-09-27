"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Zap } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { formatSqm } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { useSqmInventory, useSqmReconciliation } from "../../hooks/use-sqm-inventory";
import { useActivateSqmInventory } from "../../hooks/use-sqm-activation-mutations";

/**
 * The real sqm ledger (`AssetSqmController`, PR #82) — distinct from
 * `InventoryReconciliationPanel` below it on this tab, which is a mock-only
 * demo with no backend at all. An estate starts on legacy unit counters;
 * activating here is a one-way switch to the sqm ledger once the Land
 * Account (see the Overview tab) is complete enough for every live plan to
 * map onto it.
 */
export function SqmInventoryPanel({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_assets");
  const canManage = permissions.has("manage_assets");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: inventory, isLoading: inventoryLoading } = useSqmInventory(assetId, { enabled: canView });
  const { data: reconciliation, isLoading: reconciliationLoading } = useSqmReconciliation(assetId, {
    enabled: canView && !inventory?.sqm_inventory_active,
  });
  const activate = useActivateSqmInventory(assetId);

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view the sqm inventory.</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can grant the view_assets permission.</p>
        </CardContent>
      </Card>
    );
  }

  if (inventoryLoading || !inventory) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </section>
    );
  }

  const handleActivate = () => {
    activate.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(result.already_active ? "This estate is already on sqm inventory" : "Sqm inventory activated");
        setConfirmOpen(false);
      },
      onError: (error) => toast.error(error.message || "Couldn't activate sqm inventory"),
    });
  };

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Sqm inventory</h2>
          <p className="text-xs text-muted-foreground">
            The live square-metre ledger — capacity, selling, sold, and available, by product and size.
          </p>
        </div>
        {inventory.sqm_inventory_active ? (
          <Badge variant="outline" className="text-emerald-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Legacy units
          </Badge>
        )}
      </div>

      {!inventory.sqm_inventory_active ? (
        <div className="border-b bg-muted/20 px-4 py-3 sm:px-6">
          {reconciliationLoading || !reconciliation ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  {reconciliation.ready ? "Ready to activate" : "Not ready to activate yet"}
                </p>
                {reconciliation.blockers.length > 0 ? (
                  <ul className="space-y-1">
                    {reconciliation.blockers.map((blocker) => (
                      <li key={blocker} className="flex items-start gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        {blocker}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {reconciliation.totals.live_plans} live plan(s) checked — every one maps to a product and size.
                  </p>
                )}
              </div>
              {canManage ? (
                <Button size="sm" disabled={!reconciliation.ready} onClick={() => setConfirmOpen(true)}>
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Activate sqm inventory
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {inventory.positions.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No product pools with a land assignment yet — set up the Land Account first.
        </div>
      ) : (
        <div className="divide-y">
          {inventory.positions.map((position) => (
            <div
              key={`${position.offer_type}:${position.size_id ?? "pool"}`}
              className="grid gap-2 px-4 py-3 sm:grid-cols-6 sm:px-6"
            >
              <div className="sm:col-span-2">
                <p className="text-sm font-medium">{OFFER_TYPE_LABELS[position.offer_type]}</p>
                <p className="text-xs text-muted-foreground">
                  {position.size_id ? `${position.size_sqm ?? "—"} sqm size` : "Pool-wide"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capacity</p>
                <p className="text-sm tabular-nums">{formatSqm(position.capacity_sqm)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selling</p>
                <p className="text-sm tabular-nums">{formatSqm(position.selling_sqm)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sold</p>
                <p className="text-sm tabular-nums">{formatSqm(position.sold_sqm)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available</p>
                <p className="text-sm tabular-nums">{formatSqm(position.available_sqm)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6">
        {inventory.operational_overlay_note}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate sqm inventory?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  This switches the estate from legacy unit counters to the live square-metre ledger. It cannot be
                  undone from here — every future purchase reserves and commits sqm instead of units.
                </p>
                <p>Every live payment plan is rebuilt onto the ledger at the moment of activation.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activate.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleActivate();
              }}
              disabled={activate.isPending}
            >
              {activate.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
