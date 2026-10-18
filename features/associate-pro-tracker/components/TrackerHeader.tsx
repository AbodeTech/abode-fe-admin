"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useTrackerDashboard } from "../hooks/use-tracker-dashboard";
import { useTrackerPermissions } from "../hooks/use-tracker-permissions";
import { SetYearlyGoalDialog } from "./SetYearlyGoalDialog";
import { YearPicker } from "./YearPicker";

/**
 * Title, year picker and the goal-editing entry point.
 *
 * "Edit Goals" only appears once a goal exists — before that, the setting entry
 * point is the prompt inside the metrics section, so there is exactly one call
 * to action on screen at a time.
 *
 * There is no Export button: the design called for one, but no export route
 * exists on the tracker module. The `export_associate_pro_tracker` permission
 * is defined and unused. Add the button here when the route lands.
 */
export function TrackerHeader({ year }: { year: number }) {
  const { data } = useTrackerDashboard(year);
  const { canManageGoals } = useTrackerPermissions();
  const [editOpen, setEditOpen] = useState(false);

  const period = data?.year_period;

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#333333] sm:text-2xl">Associate Pro Tracker</h1>
        <p className="mt-1 text-sm text-[#667085]">
          {period
            ? `${period.days_elapsed} of ${period.total_days} days elapsed${
                period.days_remaining > 0 ? ` · ${period.days_remaining} remaining` : ""
              }`
            : "Progress against this year's Associate Pro and revenue targets."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <YearPicker year={year} />
        {canManageGoals && data?.goals_set ? (
          <Button variant="outline" className="bg-white" onClick={() => setEditOpen(true)}>
            Edit goals
          </Button>
        ) : null}
      </div>

      <SetYearlyGoalDialog
        year={year}
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </header>
  );
}
