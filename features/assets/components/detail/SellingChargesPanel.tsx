"use client";

import { useState } from "react";
import { History, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { formatNaira } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  CHARGE_BASIS_LABELS,
  SELLING_CHARGE_TYPE_LABELS,
  latestSellingChargeVersion,
} from "../../schemas/selling-charges.schema";
import { useSellingCharges } from "../../hooks/use-selling-charges";
import { SellingChargesDialog } from "./SellingChargesDialog";
import { SellingChargesHistorySheet } from "./SellingChargesHistorySheet";

/**
 * The estate's buyer-facing charges (land price, levies, fees, or a custom
 * one), each applying estate-wide or to one product — `GET/PUT
 * /admin/assets/:assetId/selling-charges`. Shows the version in force today
 * and, beneath it, any versions approved for a future date. Editing always
 * starts from the newest saved version.
 */
export function SellingChargesPanel({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_costs");
  const canManage = permissions.has("manage_asset_costs");
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data, isLoading, error } = useSellingCharges(assetId, { enabled: canView });
  const current = data?.in_force ?? null;
  const scheduled = data?.scheduled ?? [];

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view selling charges.</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can grant the view_asset_costs permission.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </section>
    );
  }

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Selling charges</h2>
          <p className="text-xs text-muted-foreground">
            The buyer-facing charges in force for this estate — land price, levies, and fees.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            History
          </Button>
          {canManage ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit charges
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        // A failed read must not look like "nothing set up yet".
        <p className="p-6 text-center text-sm text-rose-600">Couldn&apos;t load selling charges: {error.message}</p>
      ) : !current ? (
        <div className="p-6 text-center">
          <p className="font-medium">
            {scheduled.length > 0 ? "No selling charges in force yet" : "No selling charges approved yet"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {scheduled.length > 0
              ? "The first version is scheduled for a future date — see below."
              : "Set up at least a land price so buyers see a real total on offers here."}
          </p>
          {canManage && scheduled.length === 0 ? (
            <Button className="mt-4" size="sm" onClick={() => setEditOpen(true)}>
              Set up charges
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="divide-y">
            {current.charges.map((charge, index) => (
              <div
                key={`${charge.charge_type}:${charge.offer_type ?? "any"}:${index}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"
              >
                <div>
                  <p className="text-sm font-medium">{charge.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {SELLING_CHARGE_TYPE_LABELS[charge.charge_type]}
                    {charge.offer_type ? ` · ${OFFER_TYPE_LABELS[charge.offer_type]}` : " · Every product"}
                    {charge.note ? ` · ${charge.note}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">{formatNaira(charge.amount)}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {CHARGE_BASIS_LABELS[charge.basis]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
            Version {current.version} — effective {new Date(current.effective_date).toLocaleDateString("en-NG")},
            approved by {current.approved_by}
          </div>
        </>
      )}

      {scheduled.length > 0 ? (
        <div className="border-t">
          <p className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:px-6">
            Scheduled
          </p>
          {scheduled.map((version) => (
            <div key={version.version} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-6">
              <span>
                Version {version.version}
                <span className="ml-2 text-xs text-muted-foreground">
                  {version.charges.length} charge{version.charges.length === 1 ? "" : "s"} · {version.reason}
                </span>
              </span>
              <span className="text-xs text-amber-600">
                Takes effect {new Date(version.effective_date).toLocaleDateString("en-NG")}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <SellingChargesDialog
        assetId={assetId}
        seed={latestSellingChargeVersion(data)}
        latestVersion={data?.latest_version ?? 0}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <SellingChargesHistorySheet assetId={assetId} open={historyOpen} onOpenChange={setHistoryOpen} />
    </section>
  );
}
