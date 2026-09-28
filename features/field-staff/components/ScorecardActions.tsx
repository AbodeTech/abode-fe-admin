"use client";

import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FieldStaffType } from "../schemas/field-staff.schema";
import type { FieldScorecard } from "../schemas/scorecard.schema";
import { useFinaliseScorecard, usePublishScorecard, useRestateScorecard } from "../hooks/use-field-scorecards";
import { formatPeriod, monthEnded } from "../lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { ScorecardTargetsDialog, type TargetsDialogMode } from "./ScorecardTargetsDialog";
import { TargetHistorySheet } from "./TargetHistorySheet";

interface ScorecardActionsProps {
  staff: { id: string; name: string; staff_type: FieldStaffType };
  asset: { id: string; name: string };
  year: number;
  month: number;
  /** The current version for this site and month, drafts included. Null when none exists. */
  scorecard: FieldScorecard | null;
}

/**
 * The lifecycle buttons for one site's month:
 * none → Set targets · draft/restated → Edit, Publish · published → Revise,
 * or Finalise once the month is over · finalised → Restate.
 */
export function ScorecardActions({ staff, asset, year, month, scorecard }: ScorecardActionsProps) {
  const [dialog, setDialog] = useState<TargetsDialogMode | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [finaliseOpen, setFinaliseOpen] = useState(false);
  const [restateOpen, setRestateOpen] = useState(false);
  const [restateReason, setRestateReason] = useState("");

  const publish = usePublishScorecard();
  const finalise = useFinaliseScorecard();
  const restate = useRestateScorecard();

  const monthText = formatPeriod(year, month);
  const ended = monthEnded(year, month);
  const state = scorecard?.state ?? null;
  const editable = state === "draft" || state === "restated";

  const doPublish = () => {
    if (!scorecard) return;
    if (!scorecard.weights_complete) {
      toast.error(`Weights total ${scorecard.weight_total}%. Edit the targets so they total 100% first.`);
      return;
    }
    publish.mutate(scorecard.id, {
      onSuccess: () => toast.success(`${monthText} targets are live`),
      onError: (error) => toast.error(error.message),
    });
  };

  const doFinalise = () => {
    if (!scorecard) return;
    finalise.mutate(scorecard.id, {
      onSuccess: () => toast.success(`${monthText} is closed`),
      onError: (error) => toast.error(error.message),
    });
  };

  const doRestate = () => {
    if (!scorecard) return;
    if (!restateReason.trim()) {
      toast.error("Add a reason to restate the month");
      return;
    }
    restate.mutate(
      { id: scorecard.id, payload: { reason: restateReason.trim() } },
      {
        onSuccess: () => {
          toast.success(`${monthText} reopened. Edit the targets, then publish.`);
          setRestateReason("");
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === null && (
        <Button size="sm" onClick={() => setDialog("create")}>
          Set {monthText} targets
        </Button>
      )}
      {editable && (
        <>
          <Button size="sm" variant="outline" onClick={() => setDialog("edit")}>
            Edit targets
          </Button>
          <Button size="sm" onClick={doPublish} disabled={publish.isPending}>
            {publish.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Publish
          </Button>
        </>
      )}
      {state === "published" && !ended && (
        <Button size="sm" variant="outline" onClick={() => setDialog("revise")}>
          Revise targets
        </Button>
      )}
      {state === "published" && ended && (
        <Button size="sm" variant="outline" onClick={() => setFinaliseOpen(true)} disabled={finalise.isPending}>
          {finalise.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Finalise month
        </Button>
      )}
      {state === "finalised" && (
        <Button size="sm" variant="outline" onClick={() => setRestateOpen(true)} disabled={restate.isPending}>
          Restate
        </Button>
      )}

      {scorecard && (
        <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => setHistoryOpen(true)}>
          <History className="mr-1.5 h-3.5 w-3.5" />
          Target history
        </Button>
      )}

      {dialog && (
        <ScorecardTargetsDialog
          key={`${dialog}-${scorecard?.id ?? "new"}`}
          open
          onOpenChange={(next) => !next && setDialog(null)}
          mode={dialog}
          staff={staff}
          asset={asset}
          year={year}
          month={month}
          scorecard={scorecard}
        />
      )}

      {scorecard && (
        <TargetHistorySheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          staffId={staff.id}
          asset={asset}
          year={year}
          month={month}
        />
      )}

      <ConfirmDialog
        open={finaliseOpen}
        onOpenChange={setFinaliseOpen}
        title={`Finalise ${monthText}?`}
        description="The month's score is frozen as a snapshot. A later correction will need a restatement with a reason."
        confirmLabel="Finalise"
        destructive={false}
        onConfirm={doFinalise}
      />

      <ConfirmDialog
        open={restateOpen}
        onOpenChange={(next) => {
          setRestateOpen(next);
          if (!next) setRestateReason("");
        }}
        title={`Restate ${monthText}?`}
        description="Reopens the closed month as a new version you can edit and publish again. The finalised version stays in the history."
        confirmLabel="Restate"
        destructive={false}
        onConfirm={doRestate}
      >
        <Textarea
          value={restateReason}
          onChange={(e) => setRestateReason(e.target.value)}
          placeholder="Why is this month being reopened?"
          rows={3}
          maxLength={300}
          aria-label="Reason for restating"
        />
      </ConfirmDialog>
    </div>
  );
}
