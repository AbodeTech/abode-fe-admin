"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import {
  FIELD_RESPONSIBILITIES,
  FIELD_RESPONSIBILITY_LABELS,
  FIELD_STAFF_TYPE_LABELS,
  type FieldAssignment,
  type FieldStaffType,
} from "../schemas/field-staff.schema";
import type { FieldMetricDefinition } from "../schemas/scorecard.schema";
import { AssignSiteFormSchema, todayIso, type AssignSiteFormValues } from "../schemas/staff-form.schema";
import {
  makeTargetFormSchema,
  targetFormDefaults,
  toTargetInputs,
  type TargetFormValues,
} from "../schemas/target-form.schema";
import { useAssetOptions } from "../hooks/use-field-staff";
import { useCreateFieldAssignment, useEndFieldAssignment } from "../hooks/use-field-staff-mutations";
import {
  useCreateScorecard,
  usePublishScorecard,
  useRoleMetrics,
  useUpdateScorecard,
} from "../hooks/use-field-scorecards";
import { formatPeriod } from "../lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TargetContext } from "./ScorecardTargetsDialog";
import { TargetCards, WeightMeter, publishBlocker, targetErrorMessage } from "./TargetEditor";

const RESPONSIBILITY_HINTS = {
  primary: "The main person responsible for the site",
  support: "Helping the primary",
  relief: "Covering for someone",
} as const;

interface AssignSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: { id: string; name: string; staff_type: FieldStaffType };
  /** Their assignments — sites with one still open are left out of the picker. */
  assignments: FieldAssignment[];
}

/**
 * Put this person on a site **with** targets for the month the assignment
 * starts, so they see what's expected the moment they're assigned.
 *
 * Two steps, and nothing is saved until both are valid. The BE only accepts
 * targets for someone already assigned, so it then assigns, creates the
 * targets and publishes them. If the targets can't be saved, the assignment
 * is ended again straight away so no site is left without targets.
 */
export function AssignSiteDialog(props: AssignSiteDialogProps) {
  const { metrics, isLoading, error } = useRoleMetrics(props.staff.staff_type);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {isLoading || error ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{error ? "Couldn't load the metrics" : "Loading"}</DialogTitle>
              <DialogDescription>{error ? error.message : "Getting the metrics for this role"}</DialogDescription>
            </DialogHeader>
            {!error && (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        ) : (
          // Remounted on each open so both steps start clean.
          props.open && <AssignWizard {...props} metrics={metrics} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 text-xs text-muted-foreground" aria-label={`Step ${step} of 2`}>
      {["Site", "Targets"].map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          {i > 0 && <span className="h-px w-6 bg-border" aria-hidden />}
          <span
            className={cn(
              "grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold",
              step === i + 1 ? "bg-foreground text-background" : step > i + 1 ? "bg-[#00695C] text-white" : "bg-muted"
            )}
          >
            {i + 1}
          </span>
          <span className={cn(step === i + 1 && "font-medium text-foreground")}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function AssignWizard({
  onOpenChange,
  staff,
  assignments,
  metrics,
}: AssignSiteDialogProps & { metrics: FieldMetricDefinition[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const assets = useAssetOptions();

  const siteForm = useForm<AssignSiteFormValues>({
    resolver: zodResolver(AssignSiteFormSchema),
    defaultValues: { asset_id: "", starts_on: todayIso(), responsibility: "primary", note: "" },
  });
  const targetForm = useForm<TargetFormValues>({
    resolver: zodResolver(makeTargetFormSchema(false)),
    defaultValues: targetFormDefaults(metrics),
  });

  const assign = useCreateFieldAssignment();
  const endAssignment = useEndFieldAssignment();
  const createScorecard = useCreateScorecard();
  const updateScorecard = useUpdateScorecard();
  const publish = usePublishScorecard();
  const busy =
    assign.isPending ||
    endAssignment.isPending ||
    createScorecard.isPending ||
    updateScorecard.isPending ||
    publish.isPending;

  const openSites = new Set(assignments.filter((a) => a.status !== "ended").map((a) => a.asset?.id));
  const options = (assets.data ?? []).filter((a) => !openSites.has(a._id));

  const site = useWatch({ control: siteForm.control }) as AssignSiteFormValues;
  const siteName = options.find((a) => a._id === site.asset_id)?.name ?? "the site";
  // Targets are for the month the assignment starts.
  const year = Number(site.starts_on.slice(0, 4));
  const month = Number(site.starts_on.slice(5, 7));
  const monthText = year && month ? formatPeriod(year, month) : "";

  const close = () => {
    if (!busy) onOpenChange(false);
  };

  /** Creates the draft, or — if one already exists for the month (e.g. a failed earlier try) — reuses it. */
  const saveTargets = async (values: TargetFormValues) => {
    const targets = toTargetInputs(values.rows);
    try {
      const created = await createScorecard.mutateAsync({
        field_staff_id: staff.id,
        asset_id: site.asset_id,
        year,
        month,
        targets,
      });
      return created.id;
    } catch (error) {
      const existing = (error as ApiClientError).details as { scorecard_id?: string } | null;
      if (error instanceof ApiClientError && error.code === "SCORECARD_EXISTS" && existing?.scorecard_id) {
        await updateScorecard.mutateAsync({ id: existing.scorecard_id, payload: { targets } });
        return existing.scorecard_id;
      }
      throw error;
    }
  };

  const submit = async (values: TargetFormValues) => {
    const blocker = publishBlocker(values);
    if (blocker) {
      targetForm.setError("root", { message: `${blocker} The targets go live with the assignment.` });
      return;
    }

    let assignment: FieldAssignment;
    try {
      assignment = await assign.mutateAsync({
        staffId: staff.id,
        payload: {
          asset_id: site.asset_id,
          starts_on: site.starts_on,
          responsibility: site.responsibility,
          ...(site.note.trim() && { note: site.note.trim() }),
        },
      });
    } catch (error) {
      // Nothing was saved — send them back to the step the problem is on.
      setStep(1);
      siteForm.setError("root", { message: targetErrorMessage(error) });
      return;
    }

    try {
      const scorecardId = await saveTargets(values);
      await publish.mutateAsync(scorecardId);
      toast.success(`${staff.name} now covers ${assignment.asset?.name ?? siteName}`, {
        description: `${monthText} targets are live and they can see them now.`,
      });
      onOpenChange(false);
    } catch (error) {
      const message = targetErrorMessage(error);
      // Undo the assignment so the site isn't left assigned without targets.
      try {
        await endAssignment.mutateAsync({
          staffId: staff.id,
          assignmentId: assignment.id,
          payload: { ends_on: site.starts_on, reason: `Undone automatically: the targets couldn't be saved (${message})` },
        });
        targetForm.setError("root", {
          message: `The targets couldn't be saved, so the assignment was undone. ${message}`,
        });
      } catch {
        toast.error(`${staff.name} was assigned, but the targets couldn't be saved and the assignment couldn't be undone.`, {
          description: `${message}. Set the targets from the site page, or end the assignment from the history.`,
        });
        onOpenChange(false);
      }
    }
  };

  const goToTargets = siteForm.handleSubmit(() => {
    siteForm.clearErrors("root");
    setStep(2);
  });

  return (
    <>
      <DialogHeader className="space-y-3 border-b px-6 pb-4 pt-6 pr-12 text-left">
        <StepDots step={step} />
        <DialogTitle>{step === 1 ? "Assign a site" : `Set ${monthText} targets`}</DialogTitle>
        <DialogDescription asChild>
          <div>
            {step === 1 ? (
              <span>
                {staff.name} ({FIELD_STAFF_TYPE_LABELS[staff.staff_type]}). Next you&apos;ll set their targets — the site is
                only assigned once the targets are ready.
              </span>
            ) : (
              <TargetContext person={staff.name} site={siteName} period={monthText} />
            )}
          </div>
        </DialogDescription>
      </DialogHeader>

      {step === 1 ? (
        <Form {...siteForm}>
          <form onSubmit={goToTargets} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <FormField
                control={siteForm.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={assets.isLoading}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={assets.isLoading ? "Loading sites…" : "Pick a site"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.error ? (
                          <div className="px-2 py-1.5 text-sm text-[#AD1F2A]">{assets.error.message}</div>
                        ) : options.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No other sites to assign</div>
                        ) : (
                          options.map((a) => (
                            <SelectItem key={a._id} value={a._id}>
                              {a.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={siteForm.control}
                  name="responsibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role on the site</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FIELD_RESPONSIBILITIES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {FIELD_RESPONSIBILITY_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>{RESPONSIBILITY_HINTS[field.value]}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={siteForm.control}
                  name="starts_on"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Targets are set for this month.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={siteForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Note <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Covering phase 2" maxLength={300} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {siteForm.formState.errors.root && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#AD1F2A]">
                  {siteForm.formState.errors.root.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-4">
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Next: set targets</Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...targetForm}>
          <form onSubmit={targetForm.handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <p className="text-sm text-muted-foreground">
                These go live with the assignment, so {staff.name} sees what&apos;s expected from the moment they&apos;re
                assigned. You can revise them later from the site page.
              </p>
              <TargetCards control={targetForm.control} metrics={metrics} />
              {targetForm.formState.errors.root && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-[#AD1F2A]">
                  {targetForm.formState.errors.root.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-4 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center">
              <WeightMeter control={targetForm.control} setValue={targetForm.setValue} draftAllowed={false} />
              <div className="flex shrink-0 justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Assign and publish
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
