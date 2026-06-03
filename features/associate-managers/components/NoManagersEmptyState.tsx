"use client";

import { useState } from "react";
import { UserCog, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddManagerDialog } from "./dialogs/AddManagerDialog";

/**
 * Empty state shown to a Super Admin when no Associate Managers exist yet.
 * Surfaces a primary "Add" CTA right where the dashboard would be, instead
 * of dead-ending on "No dashboard data".
 */
export function NoManagersEmptyState() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        {/* Page header (kept consistent with the loaded-dashboard state) */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Associate Manager Performance
          </h1>
          <p className="text-muted-foreground">
            Performance and recruitment metrics scoped per manager.
          </p>
        </div>

        {/* Empty state card */}
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center">
              <UserCog className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-gray-900">
                No Associate Managers yet
              </h2>
              <p className="text-sm text-gray-600">
                Promote an existing admin to Associate Manager to start
                tracking their roster, targets, and recruitment performance.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Associate Manager
            </Button>
          </div>
        </div>
      </div>

      <AddManagerDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
