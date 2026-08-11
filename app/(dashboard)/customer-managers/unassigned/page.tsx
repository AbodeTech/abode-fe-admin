"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import {
  useUnassignedCustomers,
  UnassignedCustomersTable,
  AssignCustomersDialog,
} from "@/features/cs-managers";

/**
 * Super-admin queue of customers with no CS Manager. Safety net for the
 * pure-manual assignment model — the older a customer sits here, the
 * more urgent the assignment.
 */
export default function UnassignedCustomersPage() {
  const [assignOpen, setAssignOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const { data: customers = [], isLoading, isError, error } =
    useUnassignedCustomers();

  const openAssign = (ids: string[]) => {
    if (ids.length === 0) return;
    setPendingIds(ids);
    setAssignOpen(true);
  };

  return (
    <div className="space-y-6 py-2">
      <div>
        <Link
          href="/customer-managers"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C]"
        >
          <ChevronLeft className="h-3 w-3" />
          CS Managers
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">
          Unassigned Customers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Customers with at least one plan and no CS Manager yet. Oldest
          bubble to the top — a customer here for {">"} 7 days is overdue.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading unassigned customers…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
          Couldn't load the unassigned queue.
          {error instanceof Error && (
            <div className="mt-1 text-xs text-red-800">{error.message}</div>
          )}
        </div>
      ) : (
        <UnassignedCustomersTable
          customers={customers}
          onBulkAssign={openAssign}
          onAssignOne={(c) => openAssign([c._id])}
        />
      )}

      <AssignCustomersDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        customerIds={pendingIds}
      />
    </div>
  );
}
