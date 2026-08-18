"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle,
  CheckCheck,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";

import {
  ADMIN_REASON_MIN,
  PAYMENT_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  adminReasonSchema,
  refName,
  requestActions,
  type ClientRequest,
} from "../schemas/request.schema";
import {
  useApproveRequest,
  useCancelRequest,
  useCompleteRequest,
  useDeclineRequest,
  useReviewRequest,
} from "../hooks/use-action-requests";
import { RequestStatusBadge } from "./RequestsTable";

/* ============================================================
 * One request, in full, with every action its status allows.
 *
 * v2's lifecycle has two more stops than v1 (`under_review`, and `approved`
 * → `completed` for manual approvals) and one more exit (admin `cancel`).
 * The footer offers exactly the transitions the backend's table permits for
 * the current status — nothing here can send a move the server would refuse.
 *
 * Approve is one endpoint with a `mode`. `system` runs the effect (rename
 * the document, resize the plan) and lands on completed; `manual` records
 * the decision and waits for a human to do the work, then `complete`.
 * Custom requests have no system effect, so only manual is offered.
 * ============================================================ */

type Confirm = "decline" | "cancel" | "system" | "manual" | "complete" | "review" | null;

function fmtDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

function Field({ label, value, wide }: { label: React.ReactNode; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="font-medium wrap-anywhere">{value || "—"}</div>
    </div>
  );
}

function Change({ from, to, unit = "" }: { from: string | number; to: string | number; unit?: string }) {
  const changed = from !== to;
  return (
    <span>
      {from}
      {unit}
      {changed ? (
        <>
          {" → "}
          <span className="text-orange-600">
            {to}
            {unit}
          </span>
        </>
      ) : null}
    </span>
  );
}

/** The one populated `*_details` block, rendered by type. */
function DetailsCard({ request }: { request: ClientRequest }) {
  const dc = request.document_change_details;
  const au = request.asset_update_details;
  const cr = request.custom_request_details;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Request Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {dc ? (
            <>
              <Field label="Asset" value={refName(dc.asset) ?? dc.asset_name_snapshot} />
              <Field label="Unique asset ID" value={<span className="font-mono text-xs break-all">{dc.unique_asset_id}</span>} />
              <Field label="Document" value={dc.document_type} />
              <Field label="Name" value={<Change from={dc.current_name} to={dc.new_name} />} wide />
              <Field label="Address" value={<Change from={dc.current_address} to={dc.new_address} />} wide />
              <Field label="Reason for change" value={dc.reason_for_change} wide />
            </>
          ) : null}

          {au ? (
            <>
              <Field label="Asset" value={refName(au.asset) ?? au.asset_name_snapshot} />
              <Field label="Unique asset ID" value={<span className="font-mono text-xs break-all">{au.unique_asset_id}</span>} />
              <Field label="Changing" value={<span className="capitalize">{au.update_type}</span>} />
              <Field
                label={au.update_type === "size" ? "Size" : "Units"}
                value={
                  au.update_type === "size" ? (
                    <Change from={au.current_size} to={au.new_size} unit=" sqm" />
                  ) : (
                    <Change from={au.current_units} to={au.new_units} />
                  )
                }
              />
              <Field label="New total price" value={formatNaira(au.computed_new_total_price)} />
              <Field
                label="Price difference"
                value={
                  <span className={au.computed_price_delta >= 0 ? "text-orange-600" : "text-green-600"}>
                    {au.computed_price_delta >= 0 ? "+" : "−"}
                    {formatNaira(Math.abs(au.computed_price_delta))}
                  </span>
                }
              />
              <Field label="Reason for update" value={au.reason_for_update} wide />
            </>
          ) : null}

          {cr ? (
            <>
              <Field label="Title" value={cr.title} wide />
              <Field label="Category" value={<span className="capitalize">{cr.category}</span>} />
              <Field label="Related asset" value={refName(cr.related_asset) ?? cr.related_asset_name_snapshot} />
              <Field label="Description" value={<p className="whitespace-pre-wrap wrap-anywhere font-normal">{cr.description}</p>} wide />
              {cr.attachments.length > 0 ? (
                <Field
                  label="Attachments"
                  wide
                  value={
                    <ul className="space-y-1">
                      {cr.attachments.map((url, index) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline underline-offset-4"
                          >
                            Attachment {index + 1} <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  }
                />
              ) : null}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentCard({ request }: { request: ClientRequest }) {
  const proof = request.payment_proof;
  const discounted = request.discount_amount > 0;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Field label="Status" value={PAYMENT_STATUS_LABELS[request.payment_status]} />
          <Field
            label="Processing fee"
            value={
              discounted ? (
                <span>
                  {formatNaira(request.processing_fee)}{" "}
                  <span className="text-xs font-normal text-muted-foreground line-through">
                    {formatNaira(request.original_fee)}
                  </span>
                  {request.coupon_code_snapshot ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({request.coupon_code_snapshot})
                    </span>
                  ) : null}
                </span>
              ) : (
                formatNaira(request.processing_fee)
              )
            }
          />
          {proof ? (
            <>
              <Field label="Bank" value={proof.bank_name} />
              <Field label="Reference" value={<span className="font-mono text-xs break-all">{proof.reference_number}</span>} />
              <Field label="Submitted" value={fmtDate(proof.submitted_at)} />
              <Field label="Verified" value={proof.verified_at ? fmtDate(proof.verified_at) : "Not yet"} />
              <Field
                label="Receipt"
                wide
                value={
                  <a
                    href={proof.proof_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    Open receipt <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                }
              />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewTrailCard({ request }: { request: ClientRequest }) {
  const rows: [string, React.ReactNode][] = [];
  if (request.reviewed_at) rows.push(["Opened for review", fmtDate(request.reviewed_at)]);
  if (request.approval_mode) {
    rows.push(["Approval mode", <span key="mode" className="capitalize">{request.approval_mode}</span>]);
  }
  if (request.estimated_completion_hours) rows.push(["Estimated completion", `${request.estimated_completion_hours}h`]);
  if (request.completed_at) rows.push(["Completed", fmtDate(request.completed_at)]);
  if (request.decline_reason) rows.push(["Decline reason", request.decline_reason]);
  if (request.cancellation_reason) rows.push(["Cancellation reason", request.cancellation_reason]);
  if (request.admin_notes) rows.push(["Admin notes", request.admin_notes]);
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Review trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <Field key={label} label={label} value={value} wide={typeof value === "string" && value.length > 60} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestDetailModal({ request }: { request: ClientRequest }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const review = useReviewRequest();
  const approve = useApproveRequest();
  const complete = useCompleteRequest();
  const decline = useDeclineRequest();
  const cancel = useCancelRequest();
  const busy =
    review.isPending || approve.isPending || complete.isPending || decline.isPending || cancel.isPending;

  const actions = requestActions(request);
  const hasAnyAction =
    actions.canReview || actions.canApprove || actions.canComplete || actions.canDecline || actions.canCancel;

  const done = (message: string) => () => {
    toast.success(message);
    setConfirm(null);
    setReason("");
    setNotes("");
    setReasonError(null);
    setOpen(false);
  };
  const fail = (error: Error) => toast.error(error.message || "The action failed");
  const notesArg = notes.trim() ? { admin_notes: notes.trim() } : {};

  const validReason = (): string | null => {
    const parsed = adminReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? "Enter a reason");
      return null;
    }
    setReasonError(null);
    return parsed.data;
  };

  const run = () => {
    // The backend keys every admin action on the human-readable `request_id`
    // ("DCR-2026-0001"), never on the Mongo `_id` — `findOne({ request_id })`
    // is the only lookup in the repository. Sending `id` here 404s with
    // "That request does not exist" for a row that plainly exists.
    const id = request.request_id;
    switch (confirm) {
      case "review":
        return review.mutate({ requestId: id, ...notesArg }, { onSuccess: done("Opened for review"), onError: fail });
      case "system":
        return approve.mutate(
          { requestId: id, mode: "system", ...notesArg },
          { onSuccess: done("Approved and processed — the request is complete"), onError: fail }
        );
      case "manual":
        return approve.mutate(
          { requestId: id, mode: "manual", ...notesArg },
          { onSuccess: done("Approved for manual processing — mark it complete when the work is done"), onError: fail }
        );
      case "complete":
        return complete.mutate({ requestId: id, ...notesArg }, { onSuccess: done("Marked complete"), onError: fail });
      case "decline": {
        const parsed = validReason();
        if (!parsed) return;
        return decline.mutate(
          { requestId: id, decline_reason: parsed, ...notesArg },
          { onSuccess: done("Declined — the user has been told why"), onError: fail }
        );
      }
      case "cancel": {
        const parsed = validReason();
        if (!parsed) return;
        return cancel.mutate(
          { requestId: id, reason: parsed },
          {
            onSuccess: done(
              request.payment_status === "verified"
                ? "Cancelled — the fee has been refunded to the user's wallet"
                : "Cancelled"
            ),
            onError: fail,
          }
        );
      }
    }
  };

  const confirmCopy: Record<Exclude<Confirm, null>, { title: string; body: string; cta: string; tone: string; needsReason?: boolean }> = {
    review: {
      title: "Open for review?",
      body: "Marks the request as being looked at. The user sees it move out of the queue.",
      cta: "Open for review",
      tone: "bg-sky-600 hover:bg-sky-700",
    },
    system: {
      title: "System approve?",
      body: "Runs the change automatically — the document is renamed or the plan is resized — and marks the request completed. The user is notified.",
      cta: "Approve & process",
      tone: "bg-green-600 hover:bg-green-700",
    },
    manual: {
      title: "Manual approve?",
      body: "Records the approval and tells the user the work will be done by hand within 72 hours. Come back and mark it complete when it is.",
      cta: "Approve for manual processing",
      tone: "bg-blue-600 hover:bg-blue-700",
    },
    complete: {
      title: "Mark complete?",
      body: "Confirms the manual work is done. The user is notified and the request closes.",
      cta: "Mark complete",
      tone: "bg-emerald-600 hover:bg-emerald-700",
    },
    decline: {
      title: "Decline request?",
      body: `The reason is sent to the user — at least ${ADMIN_REASON_MIN} characters.`,
      cta: "Decline request",
      tone: "bg-red-600 hover:bg-red-700",
      needsReason: true,
    },
    cancel: {
      title: "Cancel on the user's behalf?",
      body:
        request.payment_status === "verified"
          ? `This is the only path that refunds a verified fee — ${formatNaira(request.processing_fee)} goes back to the user's wallet. Reason required, at least ${ADMIN_REASON_MIN} characters.`
          : `Withdraws the request as if the user had. Reason required, at least ${ADMIN_REASON_MIN} characters.`,
      cta: "Cancel request",
      tone: "bg-gray-700 hover:bg-gray-800",
      needsReason: true,
    },
  };

  const copy = confirm ? confirmCopy[confirm] : null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="View request details">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="flex-shrink-0 border-b p-6 pb-4">
            <div className="flex items-center justify-between gap-4 pr-8">
              <DialogTitle className="min-w-0 text-xl font-bold wrap-anywhere">
                {REQUEST_TYPE_LABELS[request.request_type]}
              </DialogTitle>
              <div className="flex-shrink-0">
                <RequestStatusBadge status={request.status} />
              </div>
            </div>
            <p className="mt-1 font-mono text-sm break-all text-muted-foreground">{request.request_id}</p>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            <div className="space-y-5 p-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Requested by
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <Field label="Name" value={refName(request.user)} />
                    <Field label="Email" value={request.user?.email} />
                    <Field
                      label={
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Submitted
                        </span>
                      }
                      value={fmtDate(request.createdAt)}
                    />
                    <Field label="Type" value={REQUEST_TYPE_LABELS[request.request_type]} />
                  </div>
                </CardContent>
              </Card>

              <DetailsCard request={request} />
              <PaymentCard request={request} />
              <ReviewTrailCard request={request} />

              {hasAnyAction ? (
                <div className="space-y-2">
                  <Label htmlFor="admin-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Admin notes (optional, kept on the request)
                  </Label>
                  <Textarea
                    id="admin-notes"
                    rows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Anything the next admin should know"
                    maxLength={2000}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {hasAnyAction ? (
            <div className="flex flex-shrink-0 flex-wrap justify-end gap-3 border-t bg-gray-50 p-6">
              {actions.canCancel ? (
                <Button variant="ghost" className="text-gray-700" onClick={() => setConfirm("cancel")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Cancel request
                </Button>
              ) : null}
              {actions.canDecline ? (
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                  onClick={() => setConfirm("decline")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              ) : null}
              {actions.canReview ? (
                <Button
                  variant="outline"
                  className="border-sky-600 text-sky-600 hover:bg-sky-50"
                  onClick={() => setConfirm("review")}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Open for review
                </Button>
              ) : null}
              {actions.canApprove ? (
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => setConfirm("manual")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Manual approve
                </Button>
              ) : null}
              {actions.canSystemApprove ? (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setConfirm("system")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  System approve
                </Button>
              ) : null}
              {actions.canComplete ? (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirm("complete")}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark complete
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm !== null} onOpenChange={(next) => (next ? undefined : setConfirm(null))}>
        <AlertDialogContent>
          {copy ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                <AlertDialogDescription>{copy.body}</AlertDialogDescription>
              </AlertDialogHeader>

              {copy.needsReason ? (
                <div className="py-2">
                  <Label htmlFor="action-reason">Reason *</Label>
                  <Textarea
                    id="action-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    className="mt-2"
                    aria-invalid={Boolean(reasonError)}
                    placeholder={confirm === "decline" ? "Why this request can't be granted" : "Why this request is being withdrawn"}
                  />
                  {reasonError ? <p className="mt-1 text-xs text-destructive">{reasonError}</p> : null}
                </div>
              ) : null}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    run();
                  }}
                  disabled={busy}
                  className={copy.tone}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Working…
                    </>
                  ) : (
                    copy.cta
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
