"use client";

import { AlertCircle, CheckCircle2, Loader2, PowerOff, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAutoAssignPreview } from "../hooks/use-cs-managers";
import {
  adminMinInitials,
  adminMinName,
  type AutoAssignPreview,
  type CSManagerSummary,
} from "../schemas/cs-manager.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The list the page already holds — `by_manager` carries ids only. */
  managers: Pick<CSManagerSummary, "id" | "manager" | "assigned_customers_count">[];
}

/**
 * Super-admin, read-only: what the auto-assign job would do if it ran now.
 *
 * The BE answers with a dry run that writes nothing and emails no one, whether
 * or not `CS_MANAGER_AUTO_ASSIGN` is on — so this is how to check the first
 * run before the flag is turned on. There is deliberately no "run" button.
 */
export function AutoAssignPreviewDialog({ open, onOpenChange, managers }: Props) {
  const { data, isLoading, isError, error, isFetching, refetch } = useAutoAssignPreview({
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Auto-assign preview</DialogTitle>
          <DialogDescription>
            What the auto-assign job would do if it ran now. This is a dry run — nobody is assigned
            and no one is emailed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Working out who would go where…
            </div>
          ) : isError || !data ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
              Couldn&apos;t load the preview.
              {error instanceof Error && <div className="mt-1 text-xs text-red-800">{error.message}</div>}
            </div>
          ) : (
            <PreviewBody preview={data} managers={managers} />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  preview,
  managers,
}: {
  preview: AutoAssignPreview;
  managers: Props["managers"];
}) {
  const byId = new Map(managers.filter((m) => m.manager).map((m) => [m.manager!.id, m]));
  const rows = [...preview.by_manager].sort((a, b) => b.assigned - a.assigned);

  return (
    <>
      {preview.enabled ? (
        <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">Auto-assign is on.</span> Every 15 minutes, each buyer
            without a CS Manager is given the one with the smallest book.
          </p>
        </div>
      ) : (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <PowerOff className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">Auto-assign is off.</span> Nothing will be assigned until
            the backend flag <code className="text-xs">CS_MANAGER_AUTO_ASSIGN</code> is turned on.
            The numbers below are what its first run would do — every waiting buyer at once.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Buyers waiting for a CS Manager" value={preview.pending} />
        <Stat
          label={preview.enabled ? "Would be assigned next run" : "Would be assigned on first run"}
          value={preview.assigned}
        />
      </div>

      {preview.status === "no_managers" ? (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#AD1F2A]">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>There is no active CS Manager to give them to. Add one first.</p>
        </div>
      ) : preview.pending === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-500">
          No buyers are waiting. Nothing to assign.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-900">Who would get them</p>
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {rows.map((row) => {
              const summary = byId.get(row.manager_id);
              return (
                <li key={row.manager_id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {summary ? adminMinInitials(summary.manager) : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                      {summary ? adminMinName(summary.manager) : "Unknown manager"}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight truncate">
                      {summary
                        ? `${summary.assigned_customers_count.toLocaleString()} customer${summary.assigned_customers_count === 1 ? "" : "s"} today`
                        : `Not in the CS Manager list · ${row.manager_id}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    +{row.assigned.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-gray-500">
        Customers whose CS Manager has since lost the role aren&apos;t included — the job never moves
        a customer who already has a manager. Assign those from the unassigned queue.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}
