"use client";

import { useState } from "react";
import { Loader2, TriangleAlert, Zap } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useActivateSqmInventory } from "../../hooks/use-sqm-activation-mutations";
import { useSqmInventory, useSqmReconciliation } from "../../hooks/use-sqm-inventory";

/**
 * Shown on the Overview only while an estate is still on legacy unit
 * counters, and gone for good once it is activated.
 *
 * An estate starts out selling by unit count. "Activating sqm inventory" is
 * the one-way switch to the square-metre ledger, which is what the header
 * bar, Product position and the rest of the asset-detail design read from.
 *
 *  - GET  .../sqm-inventory/reconciliation  a dry run: can every live plan be
 *    placed on a product and size? `ready` plus a list of `blockers` if not.
 *  - POST .../sqm-inventory/activate        the switch itself. The backend
 *    refuses it unless the dry run is ready.
 *
 * It lives here rather than in a panel of its own because the design draws
 * the activated state only; this is the step that gets an estate there.
 */
export function SqmActivationNotice({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_assets");
  const canManage = permissions.has("manage_assets");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: inventory } = useSqmInventory(assetId, { enabled: canView });
  const inactive = inventory ? !inventory.sqm_inventory_active : false;
  const { data: reconciliation } = useSqmReconciliation(assetId, { enabled: canView && inactive });
  const activate = useActivateSqmInventory(assetId);

  if (!inactive || !reconciliation) return null;

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
    <aside className="flex flex-col items-start gap-3 rounded-lg border px-3.5 py-3 sm:flex-row">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <strong className="block text-[13px] font-semibold">
          This estate still sells by unit count
          {reconciliation.ready ? " — ready to move to the sqm ledger" : " — not ready for the sqm ledger yet"}
        </strong>
        {reconciliation.blockers.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {reconciliation.blockers.map((blocker) => (
              <li key={blocker} className="flex items-start gap-1.5 text-xs text-amber-700">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {blocker}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {reconciliation.totals.live_plans.toLocaleString()} live plan(s) checked, and every one maps to a
            product and size. Available, selling and sold figures appear once it is activated.
          </p>
        )}
      </div>
      {canManage ? (
        <Button size="sm" className="shrink-0" disabled={!reconciliation.ready} onClick={() => setConfirmOpen(true)}>
          Activate sqm inventory
        </Button>
      ) : null}

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
    </aside>
  );
}
