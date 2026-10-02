"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatNaira, formatNairaCompact } from "@/lib/utils/format";

import { useAcceptClaim } from "../../hooks/use-cost-events";
import { useArchiveObligation, useCostObligation } from "../../hooks/use-cost-obligations";
import { useReviseCost } from "../../hooks/use-revise-cost";
import {
  COST_GROUP_LABELS,
  COST_SOURCE_TYPE_LABELS,
  type AssetCostEvent,
  type ObligationDetail,
} from "../../schemas/asset-cost.schema";
import {
  REVISE_MODES,
  REVISE_MODE_LABELS,
  REVISION_SOURCES,
  REVISION_SOURCE_LABELS,
  ReviseStepError,
  budgetRevisionFormSchema,
  correctDraftFormSchema,
  draftEntries,
  forecastImpact,
  isStageMode,
  lastChangedAt,
  planBudgetRevision,
  recordFigures,
  stageEntryFormSchema,
  stageEntryPayload,
  type BudgetRevisionFormValues,
  type CorrectDraftFormValues,
  type ReviseMode,
  type ReviseProgress,
  type StageEntryFormValues,
  type StageMode,
} from "../../schemas/revise-cost.schema";
import { SingleUploadField } from "../create/UploadFields";
import { EditCostMetadataDialog } from "./EditCostMetadataDialog";
import { NumberInput } from "./NumberInput";
import { ReasonDialog } from "./ReasonDialog";
import { ReverseAdjustDialog } from "./ReverseAdjustDialog";

const LABEL = "text-[11px] font-semibold";
const today = () => new Date().toISOString().slice(0, 10);
const shortDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const money = (value: number | null) => (value == null ? "—" : formatNairaCompact(value));

function Required() {
  return <span className="text-rose-600"> *</span>;
}

/** The plain-words explanation shown under the five choices. */
const MODE_NOTES: Record<ReviseMode, { title: string; body: string }> = {
  correct: {
    title: "Correct details",
    body: "Only an entry still waiting for approval can be corrected. An approved amount is never edited: reverse it and record it again, so the earlier figure stays in the history.",
  },
  revision: {
    title: "Create revision",
    body: "Approved amounts are not silently overwritten. This records the revised budget as a new entry and reverses the current one, which stays available in the history.",
  },
  committed: {
    title: "Add commitment",
    body: "A contract or approved work order. It adds to what is already committed on this record and does not affect profit.",
  },
  incurred: {
    title: "Record invoice",
    body: "Work received or an invoice raised. Once approved, this is the amount that counts against profit.",
  },
  paid: {
    title: "Record payment",
    body: "Money actually paid out. It adds to what is already paid on this record and does not change profit, which was moved when the cost was incurred.",
  },
};

/* -------------------- shared bits -------------------- */

function FormFooter({
  onCancel,
  pending,
  children,
}: {
  onCancel: () => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      {children}
    </div>
  );
}

function ImpactPreview({
  previous,
  revised,
  children,
}: {
  previous: number | null;
  revised: number | null;
  children: React.ReactNode;
}) {
  const worse = previous != null && revised != null && revised < previous;
  return (
    <section className="border-t pt-4">
      <h3 className="mb-3 text-xs font-semibold">Impact preview</h3>
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-lg border p-2.5">
          <span className="block text-[10px] text-muted-foreground">Previous remaining forecast</span>
          <strong className="mt-1 block text-sm tabular-nums">{previous == null ? "Unknown" : formatNaira(previous)}</strong>
        </div>
        <ArrowRight className="mx-auto hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden />
        <div className="rounded-lg border p-2.5">
          <span className="block text-[10px] text-muted-foreground">Revised remaining forecast</span>
          <strong className={cn("mt-1 block text-sm tabular-nums", worse && "text-amber-600")}>
            {revised == null ? "Unknown" : formatNaira(revised)}
          </strong>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">{children}</p>
    </section>
  );
}

/* -------------------- create revision -------------------- */

function RevisionForm({
  assetId,
  record,
  onDone,
  onCancel,
}: {
  assetId: string;
  record: ObligationDetail;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { reviseBudget } = useReviseCost(assetId, record.obligation.id);
  const progress = useRef<ReviseProgress>({});
  const figures = recordFigures(record);

  const form = useForm<BudgetRevisionFormValues>({
    resolver: zodResolver(budgetRevisionFormSchema),
    defaultValues: {
      amount: figures.budget ?? (undefined as unknown as number),
      effective_date: today(),
      source: "contract_variation",
      reason: "",
      reference: "",
      evidence_url: "",
    },
  });

  const impact = forecastImpact(record, "revision", form.watch("amount"));

  const submit = form.handleSubmit((values) => {
    const plan = planBudgetRevision(record, budgetRevisionFormSchema.parse(values));
    reviseBudget.mutate(
      { plan, progress: progress.current },
      {
        onSuccess: () => {
          toast.success("Budget revised");
          onDone();
        },
        onError: (error) => {
          const step = error instanceof ReviseStepError ? error.step : "add";
          toast.error(
            step === "add"
              ? error.message || "Couldn't save the revision"
              : `The revised budget is saved but not in force yet: ${error.message} Press Save revision again to finish — nothing will be entered twice.`
          );
        },
      }
    );
  });

  return (
    <Form {...form}>
      <section>
        <h3 className="mb-3 text-xs font-semibold">Revision details</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Revised budget
                  <Required />
                </FormLabel>
                <FormControl>
                  <NumberInput field={field} prefix="₦" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Effective date
                  <Required />
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Revision source
                  <Required />
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REVISION_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {REVISION_SOURCE_LABELS[source]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>Reference</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. VAR-ROAD-2026-03" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className={LABEL}>
                  Reason for revision
                  <Required />
                </FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="What changed, and who agreed it" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="evidence_url"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SingleUploadField
                    id="revise-cost.evidence"
                    label="Supporting evidence"
                    accept="image/*,application/pdf"
                    value={field.value || undefined}
                    onChange={(url) => field.onChange(url ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {impact ? (
        <div className="mt-4">
          <ImpactPreview previous={impact.previousRemaining} revised={impact.revisedRemaining}>
            Remaining forecast is the budget less what has been incurred. Profit is not affected by a budget: it uses
            incurred cost only.
          </ImpactPreview>
        </div>
      ) : null}

      <FormFooter onCancel={onCancel} pending={reviseBudget.isPending}>
        <Button type="button" size="sm" onClick={submit} disabled={reviseBudget.isPending}>
          {reviseBudget.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Save revision
        </Button>
      </FormFooter>
    </Form>
  );
}

/* -------------------- add commitment / record invoice / record payment -------------------- */

function StageForm({
  assetId,
  record,
  mode,
  canApprove,
  onDone,
  onCancel,
}: {
  assetId: string;
  record: ObligationDetail;
  mode: StageMode;
  canApprove: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { addEntry } = useReviseCost(assetId, record.obligation.id);
  const progress = useRef<ReviseProgress>({});

  const form = useForm<StageEntryFormValues>({
    resolver: zodResolver(stageEntryFormSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      effective_date: today(),
      vendor: record.obligation.vendor ?? "",
      reference: "",
      note: "",
      evidence_url: "",
    },
  });

  const impact = forecastImpact(record, mode, form.watch("amount"));
  const label = REVISE_MODE_LABELS[mode];

  function save(approve: boolean) {
    return form.handleSubmit((values) => {
      const payload = stageEntryPayload(mode, stageEntryFormSchema.parse(values));
      addEntry.mutate(
        { payload, approve, progress: progress.current },
        {
          onSuccess: () => {
            toast.success(approve ? `${label}: saved and approved` : "Saved as a draft — it counts once it is approved");
            onDone();
          },
          onError: (error) => {
            if (error instanceof ReviseStepError && error.step === "approve") {
              toast.warning(`Saved as a draft, but it could not be approved: ${error.message}`);
              onDone();
              return;
            }
            toast.error(error.message || "Couldn't save this entry");
          },
        }
      );
    })();
  }

  return (
    <Form {...form}>
      <section>
        <h3 className="mb-3 text-xs font-semibold">{label} details</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Amount
                  <Required />
                </FormLabel>
                <FormControl>
                  <NumberInput field={field} prefix="₦" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Effective date
                  <Required />
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>Vendor or payee</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>Reference</FormLabel>
                <FormControl>
                  <Input placeholder="Contract, invoice or payment reference" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="evidence_url"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SingleUploadField
                    id={`revise-cost.${mode}.evidence`}
                    label="Evidence"
                    accept="image/*,application/pdf"
                    value={field.value || undefined}
                    onChange={(url) => field.onChange(url ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>Note</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      {impact ? (
        <div className="mt-4">
          <ImpactPreview previous={impact.previousRemaining} revised={impact.revisedRemaining}>
            Once approved, profit decreases by {formatNaira(-impact.profitChange)}. Sales already completed are not
            changed.
          </ImpactPreview>
        </div>
      ) : null}

      <FormFooter onCancel={onCancel} pending={addEntry.isPending}>
        <Button
          type="button"
          variant={canApprove ? "outline" : "default"}
          size="sm"
          onClick={() => save(false)}
          disabled={addEntry.isPending}
        >
          Save draft
        </Button>
        {canApprove ? (
          <Button type="button" size="sm" onClick={() => save(true)} disabled={addEntry.isPending}>
            {addEntry.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {label}
          </Button>
        ) : null}
      </FormFooter>
    </Form>
  );
}

/* -------------------- correct details -------------------- */

function draftValues(entry: AssetCostEvent): CorrectDraftFormValues {
  return {
    entry_id: entry.id,
    amount: entry.amount ?? (undefined as unknown as number),
    effective_date: entry.effective_date ? entry.effective_date.slice(0, 10) : today(),
    vendor: entry.vendor ?? "",
    reference: entry.reference ?? "",
    note: entry.note ?? "",
  };
}

function CorrectForm({
  assetId,
  record,
  onDone,
  onCancel,
}: {
  assetId: string;
  record: ObligationDetail;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { correctDraft } = useReviseCost(assetId, record.obligation.id);
  const drafts = draftEntries(record);

  const form = useForm<CorrectDraftFormValues>({
    resolver: zodResolver(correctDraftFormSchema),
    defaultValues: drafts[0]
      ? draftValues(drafts[0])
      : { entry_id: "", amount: undefined as unknown as number, effective_date: today() },
  });

  if (drafts.length === 0) {
    return (
      <>
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Nothing on this record is waiting for approval, so there is nothing to correct. To change an approved amount,
          reverse it under Entries below and record it again.
        </p>
        <FormFooter onCancel={onCancel} pending={false}>
          {null}
        </FormFooter>
      </>
    );
  }

  const submit = form.handleSubmit((values) => {
    correctDraft.mutate(correctDraftFormSchema.parse(values), {
      onSuccess: () => {
        toast.success("Entry corrected");
        onDone();
      },
      onError: (error) => toast.error(error.message || "Couldn't save the correction"),
    });
  });

  return (
    <Form {...form}>
      <section>
        <h3 className="mb-3 text-xs font-semibold">Correction details</h3>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="entry_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className={LABEL}>
                  Entry to correct
                  <Required />
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const entry = drafts.find((candidate) => candidate.id === value);
                    if (entry) form.reset(draftValues(entry));
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drafts.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.stage_label} · {entry.amount == null ? "no amount" : formatNaira(entry.amount)} ·{" "}
                        {shortDate(entry.effective_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Amount
                  <Required />
                </FormLabel>
                <FormControl>
                  <NumberInput field={field} prefix="₦" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>
                  Effective date
                  <Required />
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>Vendor or payee</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL}>Reference</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className={LABEL}>Note</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>

      <FormFooter onCancel={onCancel} pending={correctDraft.isPending}>
        <Button type="button" size="sm" onClick={submit} disabled={correctDraft.isPending}>
          {correctDraft.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Save correction
        </Button>
      </FormFooter>
    </Form>
  );
}

/* -------------------- entries on the record -------------------- */

const ENTRY_STATUS: Record<AssetCostEvent["status"], { label: string; className: string }> = {
  draft: { label: "Awaiting approval", className: "bg-amber-500/10 text-amber-600" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600" },
  reversed: { label: "Reversed", className: "bg-rose-500/10 text-rose-600" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

function Entries({
  assetId,
  record,
  canApprove,
}: {
  assetId: string;
  record: ObligationDetail;
  canApprove: boolean;
}) {
  const { approve } = useReviseCost(assetId, record.obligation.id);
  const acceptClaim = useAcceptClaim(assetId, record.obligation.id);
  const [reverseTarget, setReverseTarget] = useState<AssetCostEvent | null>(null);
  const hasClaim = record.events.some((entry) => entry.financial_stage === "claimed" && entry.status === "approved");

  return (
    <section className="border-t pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold">Entries on this record · {record.events.length}</h3>
        {canApprove && hasClaim ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={acceptClaim.isPending}
            onClick={() =>
              acceptClaim.mutate(
                {},
                {
                  onSuccess: () => toast.success("Claim accepted — it now counts against profit"),
                  onError: (error) => toast.error(error.message || "Couldn't accept this claim"),
                }
              )
            }
          >
            Accept claim
          </Button>
        ) : null}
      </div>

      {record.events.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
          Nothing has been recorded against this cost yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {record.events.map((entry) => {
            const status = ENTRY_STATUS[entry.status];
            return (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
                <span className="w-20 shrink-0 font-semibold">{entry.stage_label}</span>
                <span className="w-28 shrink-0 tabular-nums">
                  {entry.amount == null ? "No amount" : formatNaira(entry.amount)}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {shortDate(entry.effective_date)}
                  {entry.reversal_reason ? ` · ${entry.reversal_reason}` : entry.note ? ` · ${entry.note}` : ""}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", status.className)}>
                  {status.label}
                </span>
                {canApprove && entry.status === "draft" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={approve.isPending || entry.amount == null}
                    title={entry.amount == null ? "Enter an amount first, under Correct details" : undefined}
                    onClick={() =>
                      approve.mutate(entry.id, {
                        onSuccess: () => toast.success(`${entry.stage_label} approved`),
                        onError: (error) => toast.error(error.message || "Couldn't approve this entry"),
                      })
                    }
                  >
                    Approve
                  </Button>
                ) : null}
                {canApprove && entry.status === "approved" && entry.financial_stage !== "reversal" ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setReverseTarget(entry)}>
                    Reverse
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {reverseTarget ? (
        <ReverseAdjustDialog
          assetId={assetId}
          obligationId={record.obligation.id}
          eventId={reverseTarget.id}
          stage={reverseTarget.financial_stage}
          currentAmount={reverseTarget.amount}
          open
          onOpenChange={(next) => {
            if (!next) setReverseTarget(null);
          }}
        />
      ) : null}
    </section>
  );
}

/* -------------------- the modal -------------------- */

interface Props {
  assetId: string;
  obligationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  canApprove: boolean;
}

/**
 * View and revise one cost record, as the asset-detail design draws it: the
 * record's four figures, five kinds of change, the form for the chosen one,
 * and an impact preview. `revise-cost.schema.ts` explains how each choice
 * maps onto what the backend allows.
 *
 * Beneath the form is the record's own entry list. The design doesn't draw
 * it, but approving a waiting entry and reversing an approved one have to
 * happen somewhere, and this is the record they belong to.
 */
export function ReviseCostModal({ assetId, obligationId, open, onOpenChange, canManage, canApprove }: Props) {
  const { data: record, isLoading, error } = useCostObligation(assetId, obligationId, { enabled: open });
  // A budget revision reverses the old budget, which needs approval rights.
  const [mode, setMode] = useState<ReviseMode>(canApprove ? "revision" : "committed");
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archive = useArchiveObligation(assetId, obligationId ?? "");

  const close = () => onOpenChange(false);
  const figures = record ? recordFigures(record) : null;
  const item = record?.cost_item ?? null;
  const changed = record ? lastChangedAt(record) : null;
  const note = MODE_NOTES[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>{record ? record.obligation.title : "Cost record"}</DialogTitle>
          <DialogDescription className="text-[11px]">
            {record
              ? [
                  item ? `${item.name} · ${COST_GROUP_LABELS[item.group]}` : null,
                  record.obligation.source_type !== "manual"
                    ? COST_SOURCE_TYPE_LABELS[record.obligation.source_type]
                    : null,
                  changed ? `last changed ${shortDate(changed)}` : "nothing recorded yet",
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="text-sm text-rose-600">Couldn&apos;t load this cost record: {error.message}</p>
          ) : isLoading || !record || !figures ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 sm:grid-cols-4">
                {(
                  [
                    ["Budget", figures.budget],
                    ["Committed", figures.committed],
                    ["Incurred", figures.incurred],
                    ["Paid", figures.paid],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <span className="mb-1 block text-[9px] uppercase text-muted-foreground">{label}</span>
                    <strong className="text-xs tabular-nums">{money(value)}</strong>
                  </div>
                ))}
              </div>

              {canManage ? (
                <>
                  <section>
                    <h3 className="mb-3 text-xs font-semibold">Choose the change</h3>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5" role="radiogroup" aria-label="Choose the change">
                      {REVISE_MODES.map((option) => {
                        const blocked = option === "revision" && !canApprove;
                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={mode === option}
                            disabled={blocked}
                            title={blocked ? "Revising a budget needs approval rights" : undefined}
                            onClick={() => setMode(option)}
                            className={cn(
                              "rounded-md border px-2 py-2.5 text-center text-[10px]",
                              mode === option ? "border-foreground bg-muted font-semibold" : "bg-background hover:bg-muted/40",
                              blocked && "cursor-not-allowed opacity-50"
                            )}
                          >
                            {REVISE_MODE_LABELS[option]}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <div className="border-l-[3px] border-amber-500 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-snug">
                    <strong>{note.title}</strong>
                    <br />
                    {note.body}
                  </div>

                  {/* Keyed by mode so each form starts clean, with its own save progress. */}
                  {mode === "revision" ? (
                    <RevisionForm key="revision" assetId={assetId} record={record} onDone={close} onCancel={close} />
                  ) : mode === "correct" ? (
                    <CorrectForm key="correct" assetId={assetId} record={record} onDone={close} onCancel={close} />
                  ) : isStageMode(mode) ? (
                    <StageForm
                      key={mode}
                      assetId={assetId}
                      record={record}
                      mode={mode}
                      canApprove={canApprove}
                      onDone={close}
                      onCancel={close}
                    />
                  ) : null}
                </>
              ) : null}

              <div className={cn(canManage && "pt-5")}>
                <Entries assetId={assetId} record={record} canApprove={canApprove} />
              </div>

              {canManage && item ? (
                <button
                  type="button"
                  onClick={() => setEditItemOpen(true)}
                  className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Rename or re-describe the cost item “{item.name}”
                </button>
              ) : null}

              {record.obligation.status === "archived" ? (
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                  This record is archived
                  {record.obligation.archived_reason ? `: ${record.obligation.archived_reason}` : ""}. No further
                  entries can be added to it.
                </p>
              ) : canManage ? (
                <button
                  type="button"
                  onClick={() => setArchiveOpen(true)}
                  className="block text-[11px] text-muted-foreground underline underline-offset-4 hover:text-rose-600"
                >
                  Archive this cost record
                </button>
              ) : null}
            </>
          )}
        </div>

        {item ? (
          <EditCostMetadataDialog assetId={assetId} item={item} open={editItemOpen} onOpenChange={setEditItemOpen} />
        ) : null}

        <ReasonDialog
          open={archiveOpen}
          onOpenChange={setArchiveOpen}
          title="Archive this cost record?"
          description="Archiving closes the record: no more entries can be added, and it cannot be re-opened. It does not remove what is already approved. Those amounts still count as cost until each one is reversed, so reverse them first if they should not count."
          confirmLabel="Archive record"
          placeholder="e.g. Entered twice; the other record is the one in use"
          destructive
          isPending={archive.isPending}
          onConfirm={(reason) =>
            archive.mutate(
              { reason },
              {
                onSuccess: () => {
                  toast.success("Cost record archived");
                  setArchiveOpen(false);
                },
                onError: (err: Error) => toast.error(err.message),
              }
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}
