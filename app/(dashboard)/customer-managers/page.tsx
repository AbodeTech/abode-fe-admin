"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, UserPlus2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCSManagersList,
  useUnassignedCustomers,
  useRemoveCSManager,
  CSManagersListTable,
  AddCSManagerDialog,
} from "@/features/cs-managers";
import { toast } from "sonner";

export default function CustomerManagersListPage() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: managers = [], isLoading, isError, error } = useCSManagersList();
  const { data: unassigned = [] } = useUnassignedCustomers();
  const { mutateAsync: removeCSM } = useRemoveCSManager();

  const handleRemove = async (managerId: string, displayName: string) => {
    const confirmed = window.confirm(
      `Remove ${displayName} from the CS Manager role? Their assigned customers will need to be reassigned.`
    );
    if (!confirmed) return;
    try {
      await removeCSM(managerId);
      toast.success(`${displayName} demoted`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove CS Manager"
      );
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            CS Manager Performance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Every CS Manager on the team, their current book, and their
            in-period score.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add CS Manager
        </Button>
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <b className="font-semibold">{unassigned.length} customer{unassigned.length === 1 ? "" : "s"}</b>{" "}
              waiting to be assigned to a CS Manager.
            </span>
          </div>
          <Link
            href="/customer-managers/unassigned"
            className="inline-flex items-center gap-1 rounded-md bg-white border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            <UserPlus2 className="h-3.5 w-3.5" />
            Review queue
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading CS Managers…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
          Couldn't load CS Managers.
          {error instanceof Error && (
            <div className="mt-1 text-xs text-red-800">{error.message}</div>
          )}
        </div>
      ) : (
        <CSManagersListTable
          managers={managers}
          onRemove={(m) =>
            handleRemove(
              m.manager._id,
              `${m.manager.lastName ?? ""} ${m.manager.firstName ?? ""}`.trim() ||
                m.manager.email
            )
          }
        />
      )}

      <AddCSManagerDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
