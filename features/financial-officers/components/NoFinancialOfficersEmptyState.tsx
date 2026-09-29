"use client";

import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFinancialOfficerDialog } from "./AddFinancialOfficerDialog";

export function NoFinancialOfficersEmptyState() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center py-16">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center">
            <Landmark className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-gray-900">No Financial Officers yet</h2>
            <p className="text-sm text-gray-600">
              Promote an admin to start tracking approval speed and debt recovery. Plans close to
              their final due date are assigned to officers automatically.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Financial Officer
          </Button>
        </div>
      </div>

      <AddFinancialOfficerDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
