"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { FIELD_STAFF_TYPE_LABELS, assetName, staffName } from "../schemas/field-staff.schema";
import type { SubmissionDetail } from "../schemas/submission.schema";
import {
  useFieldSubmission,
  useRejectSubmission,
  useReverseSubmission,
  useVerifySubmission,
} from "../hooks/use-field-submissions";
import { formatDate, formatDateTime } from "../lib/format";
import { proposedSides, sidesText, submissionFacts, workNotes } from "../lib/payload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EvidenceGallery } from "./EvidenceGallery";
import { SubmissionImpact } from "./SubmissionImpact";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";

/** Codes where our copy of the submission is out of date — reload it so the admin sees the truth. */
const RELOAD_ON = new Set(["SUBMISSION_STALE", "SUBMISSION_ALREADY_REVIEWED", "SUBMISSION_WARNING_UNACKNOWLEDGED"]);

interface SubmissionReviewDialogProps {
  submissionId: string | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * The whole record, then one decision: verify the work and its cost together,
 * or reject with a reason. Verified work can be reversed from here too.
 */
export function SubmissionReviewDialog({ submissionId, onOpenChange }: SubmissionReviewDialogProps) {
  const query = useFieldSubmission(submissionId);

  return (
    <Dialog open={!!submissionId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        {query.isLoading || !query.data ? (
          <>
            <DialogHeader>
              <DialogTitle>Loading submission</DialogTitle>
              <DialogDescription className="sr-only">Fetching the submission details</DialogDescription>
            </DialogHeader>
            {query.error ? (
              <p className="text-sm text-[#AD1F2A]">{query.error.message}</p>
            ) : (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          // Keyed on id + revision so form state resets when the record changes underneath.
          <ReviewBody
            key={`${query.data.submission.id}-${query.data.submission.revision}-${query.data.submission.status}`}
            detail={query.data}
            onDone={() => onOpenChange(false)}
            onStale={() => query.refetch()}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewBody({
  detail,
  onDone,
  onStale,
}: {
  detail: SubmissionDetail;
  onDone: () => void;
  onStale: () => void;
}) {
  const { submission: sub, plots, warnings } = detail;
  const [note, setNote] = useState("");
  const [acknowledgement, setAcknowledgement] = useState("");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<{ field: "ack" | "reason"; message: string } | null>(null);
  const [acceptBoundary, setAcceptBoundary] = useState(false);
  const [reversing, setReversing] = useState(false);

  const verify = useVerifySubmission();
  const reject = useRejectSubmission();
  const reverse = useReverseSubmission();
  const busy = verify.isPending || reject.isPending || reverse.isPending;

  const waiting = sub.status === "submitted";
  const proposed = proposedSides(sub);
  const facts = submissionFacts(sub, plots.map((p) => p.label));
  const notes = workNotes(sub);

  const onError = (error: Error) => {
    toast.error(error.message);
    if (error instanceof ApiClientError && error.code && RELOAD_ON.has(error.code)) onStale();
  };

  const doVerify = () => {
    if (warnings.length && !acknowledgement.trim()) {
      setFieldError({ field: "ack", message: "Explain why this is fine before verifying." });
      return;
    }
    verify.mutate(
      {
        id: sub.id,
        payload: {
          revision: sub.revision,
          ...(warnings.length && { acknowledgement: acknowledgement.trim() }),
          ...(proposed && { accept_proposed_boundary: acceptBoundary }),
          ...(note.trim() && { note: note.trim() }),
        },
      },
      {
        onSuccess: () => {
          toast.success("Verified");
          onDone();
        },
        onError,
      }
    );
  };

  const doReject = () => {
    if (!reason.trim()) {
      setFieldError({ field: "reason", message: "A reason is required. The worker sees it and records the work again." });
      return;
    }
    reject.mutate(
      { id: sub.id, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success("Rejected — the worker can record it again");
          onDone();
        },
        onError,
      }
    );
  };

  const doReverse = () => {
    if (!reason.trim()) {
      setFieldError({ field: "reason", message: "Say why this verified work is being taken back out." });
      return;
    }
    reverse.mutate(
      { id: sub.id, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success("Reversed — it no longer counts anywhere");
          onDone();
        },
        onError,
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <DialogTitle>{sub.summary}</DialogTitle>
          <SubmissionStatusBadge status={sub.status} />
        </div>
        <DialogDescription>
          {sub.metric_label} · {staffName(sub.field_staff)} ({FIELD_STAFF_TYPE_LABELS[sub.staff_type]}) ·{" "}
          {assetName(sub.asset)} · work on {formatDate(sub.work_date)}
        </DialogDescription>
      </DialogHeader>

      {!waiting && sub.reviewed_at && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
            sub.status === "verified" ? "bg-[#E0F2F1] text-[#00695C]" : "bg-muted text-foreground"
          )}
        >
          {sub.status === "verified" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p>
              {sub.status === "verified"
                ? "Verified"
                : sub.status === "rejected"
                  ? "Rejected"
                  : sub.status === "reversed"
                    ? "Reversed"
                    : "Reviewed"}
              {/* reviewed_at is the original decision, so it only dates verify/reject. */}
              {(sub.status === "verified" || sub.status === "rejected") && ` on ${formatDateTime(sub.reviewed_at)}`}.
            </p>
            {sub.review_note && <p className="mt-1">&ldquo;{sub.review_note}&rdquo;</p>}
            {sub.warning_acknowledgement && (
              <p className="mt-1 text-xs">Warning acknowledged: {sub.warning_acknowledgement}</p>
            )}
            {sub.reversal_reason && <p className="mt-1 text-xs">Reversed because: {sub.reversal_reason}</p>}
            {sub.correction_reason && <p className="mt-1 text-xs">Corrected because: {sub.correction_reason}</p>}
          </div>
        </div>
      )}

      {waiting && warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {!sub.counts_towards_target && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          This is recorded for history and cost, but doesn&apos;t count towards the target
          {sub.metric_key === "fencing_new_metres" ? " (a repair)" : sub.metric_key === "parcelation_plots" ? " (rework)" : ""}.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <EvidenceGallery evidence={sub.evidence} receiptUrl={sub.receipt_url} />
          {notes.map((n, i) => (
            <div key={i}>
              <p className="text-xs font-medium text-muted-foreground">Note from the worker</p>
              <p className="mt-1 text-sm">{n}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-white px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 text-sm font-medium wrap-break-word">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <SubmissionImpact detail={detail} />
        </div>
      </div>

      <section className="text-sm">
        <h3 className="mb-2 font-semibold">History</h3>
        <ol className="space-y-1">
          {sub.created_at && <HistoryRow at={sub.created_at} text="Recorded in the field app" />}
          {sub.submitted_at && <HistoryRow at={sub.submitted_at} text="Sent for review" />}
          {sub.reviewed_at && (
            <HistoryRow at={sub.reviewed_at} text={sub.status === "rejected" ? "Rejected" : "Verified"} />
          )}
          {sub.revision > 1 && <li className="text-muted-foreground">Revision {sub.revision}</li>}
        </ol>
      </section>

      {waiting && (
        <div className="space-y-3 border-t pt-4">
          {proposed && (
            <label className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <Checkbox checked={acceptBoundary} onCheckedChange={(v) => setAcceptBoundary(v === true)} className="mt-0.5" />
              <span>
                Also accept the proposed boundary ({sidesText(proposed)}) as the estate&apos;s approved boundary.
                <span className="block text-xs text-muted-foreground">Leave unticked to verify the surveyed metres only.</span>
              </span>
            </label>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="review-ack">Why is this fine despite the warning?</Label>
              <Textarea
                id="review-ack"
                value={acknowledgement}
                onChange={(e) => {
                  setAcknowledgement(e.target.value);
                  setFieldError(null);
                }}
                rows={2}
                maxLength={500}
                placeholder="e.g. Two crews worked different sections"
                aria-invalid={fieldError?.field === "ack"}
              />
              {fieldError?.field === "ack" && <p className="text-sm text-[#AD1F2A]">{fieldError.message}</p>}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="review-note">
                Note <span className="font-normal text-muted-foreground">(optional, kept with the verification)</span>
              </Label>
              <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-reason">
                Reason <span className="font-normal text-muted-foreground">(needed to reject)</span>
              </Label>
              <Textarea
                id="review-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setFieldError(null);
                }}
                rows={2}
                maxLength={500}
                placeholder="What the worker needs to fix"
                aria-invalid={fieldError?.field === "reason"}
              />
              {fieldError?.field === "reason" && <p className="text-sm text-[#AD1F2A]">{fieldError.message}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">One decision covers the work and its recorded cost.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={doReject} disabled={busy}>
                {reject.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Reject
              </Button>
              <Button onClick={doVerify} disabled={busy}>
                {verify.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {sub.status === "verified" && (
        <div className="space-y-3 border-t pt-4">
          {!reversing ? (
            <Button variant="ghost" className="text-[#AD1F2A] hover:text-[#AD1F2A]" onClick={() => setReversing(true)}>
              <Undo2 className="mr-1.5 h-4 w-4" />
              Reverse this verification
            </Button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="reverse-reason">Why is this being reversed?</Label>
              <p className="text-xs text-muted-foreground">
                It comes out of the score, site setup and costs in one step. The record stays, marked reversed.
              </p>
              <Textarea
                id="reverse-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setFieldError(null);
                }}
                rows={2}
                maxLength={500}
                placeholder="e.g. The work was never done"
                aria-invalid={fieldError?.field === "reason"}
              />
              {fieldError?.field === "reason" && <p className="text-sm text-[#AD1F2A]">{fieldError.message}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setReversing(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={doReverse} disabled={busy}>
                  {reverse.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Reverse
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function HistoryRow({ at, text }: { at: string; text: string }) {
  return (
    <li className="flex flex-wrap gap-x-2">
      <span className="w-32 shrink-0 text-muted-foreground">{formatDateTime(at)}</span>
      <span>{text}</span>
    </li>
  );
}
