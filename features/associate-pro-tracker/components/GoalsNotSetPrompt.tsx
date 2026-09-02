"use client";

import { useState } from "react";
import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTrackerPermissions } from "../hooks/use-tracker-permissions";
import { SetYearlyGoalDialog } from "./SetYearlyGoalDialog";

/**
 * Stands in for the two progress bars when a year has no goal.
 *
 * Inline rather than full-page on purpose: every other section on this page is
 * measured live and renders fine without a goal, so an operator reviewing a
 * historical year still sees all of its real data.
 *
 * Handles both cases the page can reach it in — a new year nobody has set
 * targets for yet, and a past year where they never were.
 */
export function GoalsNotSetPrompt({ year }: { year: number }) {
  const { canManageGoals } = useTrackerPermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isPastYear = year < new Date().getFullYear();

  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Target className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">Goals for {year} not set</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {!canManageGoals
          ? `Progress bars appear once an admin with permission to manage yearly goals sets the ${year} targets.`
          : isPastYear
            ? `${year} ended without targets. You can still set them retroactively to score the year.`
            : `Set the Associate Pro and revenue targets for ${year} to start tracking progress.`}
      </p>
      {canManageGoals ? (
        <>
          <Button className="mt-5" onClick={() => setDialogOpen(true)}>
            Set goals for {year}
          </Button>
          <SetYearlyGoalDialog
            year={year}
            mode="create"
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </>
      ) : null}
    </div>
  );
}
