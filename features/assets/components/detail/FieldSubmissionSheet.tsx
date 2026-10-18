"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";

import {
  useCorrectSubmission,
  useFieldSubmission,
  useLinkSubmissionPlots,
  useRejectSubmission,
  useReverseSubmission,
  useVerifySubmission,
} from "../../hooks/use-field-operations";
import { usePlotInventory } from "../../hooks/use-plot-inventory";
import {
  CORRECTABLE_FIELDS,
  EFFECT_LABELS,
  SUBMISSION_STATUS_LABELS,
  buildCorrection,
  correctSubmissionFormSchema,
  correctionDefaults,
  proposedSides,
  submissionActions,
  verifySubmissionFormSchema,
  workDetails,
  type CorrectSubmissionFormValues,
  type FieldSubmission,
  type FieldSubmissionDetail,
  type SubmissionAction,
  type SubmissionStatus,
  type VerifySubmissionFormValues,
} from "../../schemas/field-operations.schema";
import { FENCING_SIDES, FENCING_SIDE_LABELS } from "../../schemas/site-setup.schema";
import { NumberInput } from "./NumberInput";
import { ReasonDialog } from "./ReasonDialog";

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-500/10 text-amber-600",
  verified: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-rose-500/10 text-rose-600",
  withdrawn: "bg-muted text-muted-foreground",
  corrected: "bg-sky-500/10 text-sky-600",
  reversed: "bg-rose-500/10 text-rose-600",
};

export function SubmissionStatusPill({ status }: { status: SubmissionStatus }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold", STATUS_CLASS[status])}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}

const day = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

const LABEL = "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={LABEL}>{label}</p>
      <div className="mt-0.5 text-sm wrap-break-word">{value ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t pt-4">
      <h3 className="text-xs font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/* -------------------- verify -------------------- */

function VerifyForm({
  assetId,
  detail,
  onDone,
  onCancel,
}: {
  assetId: string;
  detail: FieldSubmissionDetail;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { submission, warnings } = detail;
  const verify = useVerifySubmission(assetId);
  const proposed = proposedSides(submission);
  const form = useForm<VerifySubmissionFormValues>({
    resolver: zodResolver(verifySubmissionFormSchema(warnings.length > 0)),
    defaultValues: { acknowledgement: "", accept_proposed_boundary: false, note: "" },
  });

  const submit = form.handleSubmit((values) =>
    verify.mutate(
      { submissionId: submission.id, revision: submission.revision, ...values },
      {
        onSuccess: () => {
          toast.success(warnings.length > 0 ? "Verified, with the warning kept on the record" : "Field work verified");
          onDone();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    )
  );

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-3 rounded-md border bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">
          Verifying accepts the work, its plots and its cost in one step. It then counts towards site progress, the
          worker&apos;s score and the estate&apos;s costs.
        </p>

        {warnings.length > 0 ? (
          <FormField
            control={form.control}
            name="acknowledgement"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Why verify despite the warning?</FormLabel>
                <FormControl>
                  <Textarea rows={2} maxLength={500} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {proposed ? (
          <FormField
            control={form.control}
            name="accept_proposed_boundary"
            render={({ field }) => (
              <FormItem className="flex items-start gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} />
                </FormControl>
                <FormLabel className="text-xs font-normal leading-snug">
                  Also accept the proposed side measurements as the estate&apos;s approved boundary. This creates a new
                  boundary version, and fencing progress is measured against it from then on.
                </FormLabel>
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Review note (optional)</FormLabel>
              <FormControl>
                <Input maxLength={500} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={verify.isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={verify.isPending}>
            {verify.isPending ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* -------------------- correct -------------------- */

function CorrectForm({
  assetId,
  submission,
  onDone,
  onCancel,
}: {
  assetId: string;
  submission: FieldSubmission;
  onDone: () => void;
  onCancel: () => void;
}) {
  const correct = useCorrectSubmission(assetId);
  const fields = CORRECTABLE_FIELDS[submission.metric_key] ?? [];
  const form = useForm<CorrectSubmissionFormValues>({
    resolver: zodResolver(correctSubmissionFormSchema),
    defaultValues: correctionDefaults(submission),
  });

  const submit = form.handleSubmit((values) => {
    const dto = buildCorrection(submission, values);
    if ("error" in dto) {
      toast.error(dto.error);
      return;
    }
    correct.mutate(
      { submissionId: submission.id, ...dto },
      {
        onSuccess: () => {
          toast.success("Corrected. The earlier figures no longer count.");
          onDone();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-3 rounded-md border bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">
          A correction replaces the verified figures. The earlier ones stop counting everywhere, and the change is kept
          as revision {submission.revision + 1}.
          {submission.metric_key === "parcelation_plots"
            ? " For parcelation only the amount spent can be corrected here; to change which plots were pegged, reverse this and have it recorded again."
            : ""}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {fields.includes("metres") ? (
            <FormField
              control={form.control}
              name="metres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Metres</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="m" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {fields.includes("side") ? (
            <FormField
              control={form.control}
              name="side"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Side</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FENCING_SIDES.map((side) => (
                        <SelectItem key={side} value={side}>
                          {FENCING_SIDE_LABELS[side]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {fields.includes("work_type") ? (
            <FormField
              control={form.control}
              name="work_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Work</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New fencing</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {fields.includes("actual_sqm") ? (
            <FormField
              control={form.control}
              name="actual_sqm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Area cleared</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="sqm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {fields.includes("coverage") ? (
            <FormField
              control={form.control}
              name="coverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Coverage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full">Fully cleared</SelectItem>
                      <SelectItem value="partial">Partly cleared</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="amount_spent"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Amount spent</FormLabel>
                <FormControl>
                  <NumberInput field={field} prefix="₦" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Reason for the correction</FormLabel>
              <FormControl>
                <Textarea rows={2} maxLength={500} placeholder="e.g. Metres were entered as 600 instead of 60" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={correct.isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={correct.isPending}>
            {correct.isPending ? "Saving…" : "Save correction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/* -------------------- link plots -------------------- */

function LinkPlotsForm({
  assetId,
  submission,
  onDone,
  onCancel,
}: {
  assetId: string;
  submission: FieldSubmission;
  onDone: () => void;
  onCancel: () => void;
}) {
  const link = useLinkSubmissionPlots(assetId);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  // The plot endpoint caps a page at 200; the search narrows a larger estate.
  const plots = usePlotInventory(assetId, { limit: 200, search: search.trim() || undefined });
  const rows = plots.data?.data.plots ?? [];
  const more = (plots.data?.meta.totalPages ?? 1) > 1;

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">
        This clearing was recorded as an unmapped area. Attach the plots it covers so they show as cleared. The area
        ({submission.quantity.toLocaleString()} sqm) is shared equally between the plots picked; the work and its cost
        are not counted again.
      </p>
      <Input placeholder="Search plots, e.g. A-12" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="max-h-48 overflow-y-auto rounded-md border bg-background">
        {plots.isLoading ? (
          <Skeleton className="m-2 h-16" />
        ) : plots.error ? (
          <p className="p-3 text-xs text-rose-600">Couldn&apos;t load plots: {plots.error.message}</p>
        ) : rows.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No plots match.</p>
        ) : (
          rows.map((plot) => (
            <label key={plot.id} className="flex cursor-pointer items-center gap-2 border-b px-3 py-1.5 text-xs last:border-b-0">
              <Checkbox checked={picked.includes(plot.id)} onCheckedChange={() => toggle(plot.id)} />
              <span className="font-medium">{plot.label}</span>
              <span className="text-muted-foreground">{plot.size_sqm.toLocaleString()} sqm</span>
            </label>
          ))
        )}
      </div>
      {more ? <p className="text-[11px] text-muted-foreground">Showing the first 200 plots. Search to find others.</p> : null}
      <Input placeholder="Note (optional)" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{picked.length} picked</span>
        <span className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={link.isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={link.isPending || picked.length === 0}
            onClick={() =>
              link.mutate(
                { submissionId: submission.id, plot_ids: picked, note },
                {
                  onSuccess: () => {
                    toast.success("Plots linked");
                    onDone();
                  },
                  onError: (error: Error) => toast.error(error.message),
                }
              )
            }
          >
            {link.isPending ? "Linking…" : "Link plots"}
          </Button>
        </span>
      </div>
    </div>
  );
}

/* -------------------- the sheet -------------------- */

const ACTION_LABELS: Record<SubmissionAction, string> = {
  verify: "Verify",
  reject: "Reject",
  correct: "Correct figures",
  reverse: "Reverse",
  link_plots: "Link plots",
};

interface Props {
  assetId: string;
  submissionId: string | null;
  canVerify: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * One field submission, as a reviewer needs it: what was recorded, the
 * evidence, the plots, any warnings, and what verifying wrote. The actions
 * offered are exactly those the backend accepts in the submission's current
 * state (`submissionActions`).
 */
export function FieldSubmissionSheet({ assetId, submissionId, canVerify, onOpenChange }: Props) {
  const { data: detail, isLoading, error } = useFieldSubmission(assetId, submissionId);
  const [mode, setMode] = useState<SubmissionAction | null>(null);
  const reject = useRejectSubmission(assetId);
  const reverse = useReverseSubmission(assetId);

  const submission = detail?.submission;
  const actions = submission && canVerify ? submissionActions(submission) : [];
  const details = submission ? workDetails(submission) : [];
  const done = () => setMode(null);

  return (
    <Sheet
      open={submissionId !== null}
      onOpenChange={(open) => {
        if (!open) setMode(null);
        onOpenChange(open);
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {submission ? submission.metric_label : "Field work"}
            {submission ? <SubmissionStatusPill status={submission.status} /> : null}
          </SheetTitle>
          <SheetDescription>{submission ? submission.summary : "Loading…"}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {error ? (
            <p className="text-sm text-rose-600">Couldn&apos;t load this submission: {error.message}</p>
          ) : isLoading || !detail || !submission ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {detail.warnings.length > 0 ? (
                <aside className="flex gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <ul className="space-y-1 text-xs">
                    {detail.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </aside>
              ) : null}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Worker" value={submission.field_staff?.full_name ?? submission.field_staff?.email} />
                <Fact label="Work date" value={day(submission.work_date)} />
                <Fact
                  label="Quantity"
                  value={`${submission.quantity.toLocaleString()}${submission.unit ? ` ${submission.unit}` : ""}${
                    submission.counts_towards_target ? "" : " (not counted towards the target)"
                  }`}
                />
                <Fact
                  label="Amount spent"
                  value={submission.amount_spent == null ? null : formatNaira(submission.amount_spent)}
                />
                <Fact label="Vendor" value={submission.vendor} />
                <Fact label="Payment reference" value={submission.payment_reference} />
                <Fact label="Sent for review" value={day(submission.submitted_at)} />
                <Fact label="Reviewed" value={day(submission.reviewed_at)} />
              </div>

              {details.length > 0 ? (
                <Section title="Work details">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {details.map((row) => (
                      <Fact key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                </Section>
              ) : null}

              {detail.plots.length > 0 ? (
                <Section title={`Plots (${detail.plots.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.plots.map((plot) => (
                      <span key={plot.id} className="rounded-full border px-2 py-0.5 text-[11px]">
                        {plot.label} · {plot.size_sqm.toLocaleString()} sqm
                      </span>
                    ))}
                  </div>
                </Section>
              ) : null}

              <Section title={`Evidence (${submission.evidence.length})`}>
                {submission.evidence.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No evidence was attached.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {submission.evidence.map((item) => (
                      <li key={item.url}>
                        <a href={item.url} target="_blank" rel="noreferrer" className="font-medium capitalize underline underline-offset-4">
                          {item.kind}
                        </a>
                        {item.caption ? <span className="text-muted-foreground"> · {item.caption}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {submission.receipts.length > 0 ? (
                <Section title={`Receipts (${submission.receipts.length})`}>
                  <ul className="space-y-1 text-xs">
                    {submission.receipts.map((receipt) => (
                      <li key={receipt.url} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <a href={receipt.url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                            View receipt
                          </a>
                          {receipt.caption || receipt.reference ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · {[receipt.caption, receipt.reference].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                        </span>
                        <span className="tabular-nums">{receipt.amount == null ? "No amount" : formatNaira(receipt.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  {submission.receipts_total != null ? (
                    <p className="text-[11px] text-muted-foreground">
                      Receipts with an amount add up to {formatNaira(submission.receipts_total)}.
                    </p>
                  ) : null}
                </Section>
              ) : null}

              {detail.effects.length > 0 ? (
                <Section title="What verifying wrote">
                  <ul className="space-y-1 text-xs">
                    {detail.effects.map((effect, index) => (
                      <li
                        key={`${effect.effect_type}-${effect.revision}-${index}`}
                        className={cn("flex justify-between gap-2", effect.is_reversed && "text-muted-foreground line-through")}
                      >
                        <span>
                          {EFFECT_LABELS[effect.effect_type] ?? effect.effect_type} · revision {effect.revision}
                        </span>
                        <span className="tabular-nums">
                          {effect.amount != null
                            ? formatNaira(effect.amount)
                            : effect.quantity != null
                              ? effect.quantity.toLocaleString()
                              : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground">Struck-through lines were reversed and no longer count.</p>
                </Section>
              ) : null}

              {submission.review_note ||
              submission.warning_acknowledgement ||
              submission.correction_reason ||
              submission.reversal_reason ? (
                <Section title="Review record">
                  <div className="grid gap-3">
                    {submission.review_note ? (
                      <Fact label={submission.status === "rejected" ? "Reason for rejection" : "Review note"} value={submission.review_note} />
                    ) : null}
                    {submission.warning_acknowledgement ? (
                      <Fact label="Verified despite a warning because" value={submission.warning_acknowledgement} />
                    ) : null}
                    {submission.correction_reason ? (
                      <Fact label={`Corrected (now revision ${submission.revision})`} value={submission.correction_reason} />
                    ) : null}
                    {submission.reversal_reason ? <Fact label="Reversed because" value={submission.reversal_reason} /> : null}
                  </div>
                </Section>
              ) : null}

              {actions.length > 0 ? (
                <Section title="Review">
                  {mode === "verify" ? (
                    <VerifyForm assetId={assetId} detail={detail} onDone={done} onCancel={done} />
                  ) : mode === "correct" ? (
                    <CorrectForm assetId={assetId} submission={submission} onDone={done} onCancel={done} />
                  ) : mode === "link_plots" ? (
                    <LinkPlotsForm assetId={assetId} submission={submission} onDone={done} onCancel={done} />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <Button
                          key={action}
                          type="button"
                          size="sm"
                          variant={action === "verify" ? "default" : "outline"}
                          className={action === "reject" || action === "reverse" ? "text-rose-600" : undefined}
                          onClick={() => setMode(action)}
                        >
                          {ACTION_LABELS[action]}
                        </Button>
                      ))}
                    </div>
                  )}
                </Section>
              ) : null}
            </>
          )}
        </div>

        <ReasonDialog
          open={mode === "reject"}
          onOpenChange={(open) => !open && done()}
          title="Reject this field work?"
          description="It goes back to the worker with your reason, and they can record it again. Nothing is counted."
          confirmLabel="Reject"
          placeholder="e.g. The photos do not show the fenced section"
          destructive
          isPending={reject.isPending}
          onConfirm={(reason) =>
            submissionId &&
            reject.mutate(
              { submissionId, reason },
              {
                onSuccess: () => {
                  toast.success("Rejected");
                  done();
                },
                onError: (err: Error) => toast.error(err.message),
              }
            )
          }
        />

        <ReasonDialog
          open={mode === "reverse"}
          onOpenChange={(open) => !open && done()}
          title="Reverse this verification?"
          description="The work stops counting towards site progress, the worker's score and the estate's costs. A reversed submission cannot be verified again."
          confirmLabel="Reverse"
          placeholder="e.g. The work was never done"
          destructive
          isPending={reverse.isPending}
          onConfirm={(reason) =>
            submissionId &&
            reverse.mutate(
              { submissionId, reason },
              {
                onSuccess: () => {
                  toast.success("Reversed");
                  done();
                },
                onError: (err: Error) => toast.error(err.message),
              }
            )
          }
        />
      </SheetContent>
    </Sheet>
  );
}
