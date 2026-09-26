"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Loader2, MapPin, User } from "lucide-react";
import { toast } from "sonner";

import type { FieldStaffType } from "../schemas/field-staff.schema";
import type { FieldMetricDefinition, FieldScorecard } from "../schemas/scorecard.schema";
import {
  makeTargetFormSchema,
  targetFormDefaults,
  toTargetInputs,
  type TargetFormValues,
} from "../schemas/target-form.schema";
import {
  useCreateScorecard,
  usePublishScorecard,
  useReviseScorecard,
  useRoleMetrics,
  useUpdateScorecard,
} from "../hooks/use-field-scorecards";
import { formatPeriod } from "../lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { TargetCards, WeightMeter, publishBlocker, targetErrorMessage } from "./TargetEditor";

/**
 * `create` — no scorecard for the month yet.
 * `edit` — change a draft or a restated version.
 * `revise` — change published targets: a reason, then a new version.
 */
export type TargetsDialogMode = "create" | "edit" | "revise";

interface ScorecardTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: TargetsDialogMode;
  staff: { id: string; name: string; staff_type: FieldStaffType };
  asset: { id: string; name: string };
  year: number;
  month: number;
  /** The current version. Required for `edit` and `revise`. */
  scorecard: FieldScorecard | null;
}

/**
 * Set, edit or revise one person's targets for one site and month. Only the
 * metrics the role can have are offered (from the metrics endpoint).
 * Callers key this by mode + scorecard id so it remounts with fresh defaults.
 */
export function ScorecardTargetsDialog(props: ScorecardTargetsDialogProps) {
  const { metrics, isLoading, error } = useRoleMetrics(props.staff.staff_type);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {isLoading ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Loading metrics</DialogTitle>
              <DialogDescription className="sr-only">Fetching what this role can be measured on</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Couldn&apos;t load the metrics</DialogTitle>
              <DialogDescription>{error.message}</DialogDescription>
            </DialogHeader>
          </div>
        ) : (
          <TargetsForm {...props} metrics={metrics} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Person, site and month as three labelled items — shared with the assign dialog. */
export function TargetContext({ person, site, period }: { person: string; site: string; period: string }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-1.5">
        <User className="h-3.5 w-3.5" aria-hidden />
        {person}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        {site}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        {period}
      </span>
    </div>
  );
}

function TargetsForm({
  onOpenChange,
  mode,
  staff,
  asset,
  year,
  month,
  scorecard,
  metrics,
}: ScorecardTargetsDialogProps & { metrics: FieldMetricDefinition[] }) {
  const schema = useMemo(() => makeTargetFormSchema(mode === "revise"), [mode]);
  const form = useForm<TargetFormValues>({
    resolver: zodResolver(schema),
    defaultValues: targetFormDefaults(metrics, mode === "create" ? null : scorecard),
  });

  const create = useCreateScorecard();
  const update = useUpdateScorecard();
  const publish = usePublishScorecard();
  const revise = useReviseScorecard();
  const busy = create.isPending || update.isPending || publish.isPending || revise.isPending;

  const monthText = formatPeriod(year, month);

  const save = async (values: TargetFormValues, intent: "draft" | "publish") => {
    const targets = toTargetInputs(values.rows);

    if (intent === "publish") {
      const blocker = publishBlocker(values);
      if (blocker) {
        form.setError("root", { message: `${blocker} Save it as a draft, or fix it to publish.` });
        return;
      }
    }

    // Tracks how far a multi-step save got, so a failure half-way says what exists now.
    let draftId: string | null = mode === "edit" ? (scorecard?.id ?? null) : null;
    try {
      if (mode === "create") {
        const created = await create.mutateAsync({
          field_staff_id: staff.id,
          asset_id: asset.id,
          year,
          month,
          targets,
        });
        draftId = created.id;
      } else if (mode === "revise" && scorecard) {
        const next = await revise.mutateAsync({ id: scorecard.id, payload: { reason: values.reason.trim() } });
        draftId = next.id;
        await update.mutateAsync({ id: next.id, payload: { targets } });
      } else if (scorecard) {
        await update.mutateAsync({ id: scorecard.id, payload: { targets } });
      }

      if (intent === "publish" && draftId) {
        await publish.mutateAsync(draftId);
        toast.success(`${monthText} targets are live`);
      } else {
        toast.success("Draft saved. The worker can't see it until it's published.");
      }
      onOpenChange(false);
    } catch (error) {
      const message = targetErrorMessage(error);
      if (draftId && mode !== "edit") {
        // The new version exists as a draft even though a later step failed.
        toast.error(`${message}. The targets were kept as a draft — open "Edit targets" to finish.`);
        onOpenChange(false);
      } else {
        form.setError("root", { message });
      }
    }
  };

  const title =
    mode === "revise"
      ? `Revise ${monthText} targets`
      : mode === "edit"
        ? `Edit ${monthText} targets`
        : `Set ${monthText} targets`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => save(values, "publish"))} className="flex min-h-0 flex-1 flex-col">
        <DialogHeader className="border-b px-6 pb-4 pt-6 pr-12 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>
              <TargetContext person={staff.name} site={asset.name} period={monthText} />
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <p className="text-sm text-muted-foreground">
            {mode === "revise"
              ? "This opens a new version. The month isn't scored until it's published; the current version stays in the history."
              : "Pick the work this person is responsible for, then give each a target and a share of the score."}
          </p>

          <TargetCards control={form.control} metrics={metrics} />

          {mode === "revise" && (
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why are the targets changing?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Rain stopped work for two weeks" rows={2} maxLength={300} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.formState.errors.root && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#AD1F2A]">{form.formState.errors.root.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center">
          <WeightMeter control={form.control} setValue={form.setValue} />
          <div className="flex shrink-0 justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={form.handleSubmit((values) => save(values, "draft"))}
            >
              Save draft
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Publish
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
