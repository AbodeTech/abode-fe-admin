"use client";

import { UserPlus2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** Super-admin only — surfaces the assignment CTA. */
  onAssign?: () => void;
}

/**
 * Shown when the FLEX Manager role sits unassigned. Suppresses the KPI
 * grid so 0-values don't read as failure — nothing was tracked because
 * no one held the role.
 */
export function UnassignedFlexManagerCard({ onAssign }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="mx-auto h-10 w-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mb-3">
        <ShieldOff className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No FLEX Manager assigned
      </h3>
      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
        Once a FLEX Manager is assigned, this dashboard shows their monthly
        targets, actuals, and score for the Flex product.
      </p>
      {onAssign && (
        <Button className="mt-4" onClick={onAssign}>
          <UserPlus2 className="h-4 w-4 mr-1.5" />
          Assign a FLEX Manager
        </Button>
      )}
    </div>
  );
}
