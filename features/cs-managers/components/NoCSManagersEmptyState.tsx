"use client";

import { useState } from "react";
import { Plus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCSManagerDialog } from "./AddCSManagerDialog";

export function NoCSManagersEmptyState() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center py-16">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center">
            <UserCog className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-gray-900">No CS Managers yet</h2>
            <p className="text-sm text-gray-600">
              Promote an existing admin to CS Manager to start tracking assignments, targets, and
              deed deliveries.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add CS Manager
          </Button>
        </div>
      </div>

      <AddCSManagerDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
