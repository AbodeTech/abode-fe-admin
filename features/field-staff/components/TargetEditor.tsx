"use client";

import { useState } from "react";
import { useFieldArray, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { Plus } from "lucide-react";

import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import type { FieldMetricDefinition } from "../schemas/scorecard.schema";
import { includedWeightTotal, type TargetFormValues } from "../schemas/target-form.schema";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/* ============================================================
 * The target-setting UI shared by "Set targets" and "Assign site":
 * a card per metric the role can have, and a weight meter.
 * Both work on a react-hook-form holding TargetFormValues.
 * ============================================================ */

const UNIT_SHORT: Record<string, string> = { metres: "m", sqm: "sqm", plots: "plots", customers: "customers" };

/** Number inputs without the browser's spinner arrows — they're easy to nudge by accident. */
const NO_SPINNER =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/** The BE's `details.issues[]` are written for humans — show them as they are. */
export function targetErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const issues = (error.details as { issues?: unknown } | null)?.issues;
    if (Array.isArray(issues) && issues.length) return issues.join(". ");
    return error.message;
  }
  return error instanceof Error ? error.message : "Could not save the targets";
}

/** Why the targets can't be published yet, or null when they can. */
export function publishBlocker(values: TargetFormValues): string | null {
  if (!values.rows.some((r) => r.included)) return "Include at least one metric.";
  const total = includedWeightTotal(values.rows);
  if (total !== 100) return `Weights total ${total}%. They must total exactly 100%.`;
  return null;
}

/** Equal whole-cent shares that add up to exactly 100; the last row takes the rounding remainder. */
function evenWeights(count: number): string[] {
  if (count === 0) return [];
  const share = Math.floor((100 / count) * 100) / 100;
  const last = Math.round((100 - share * (count - 1)) * 100) / 100;
  return Array.from({ length: count }, (_, i) => String(i === count - 1 ? last : share));
}

/** Weight meter plus "Split evenly". `draftAllowed` changes the hint for forms that can save a draft. */
export function WeightMeter({
  control,
  setValue,
  draftAllowed = true,
}: {
  control: Control<TargetFormValues>;
  setValue: UseFormSetValue<TargetFormValues>;
  draftAllowed?: boolean;
}) {
  const rows = useWatch({ control, name: "rows" }) ?? [];
  const total = includedWeightTotal(rows);
  const included = rows.map((r, i) => (r.included ? i : -1)).filter((i) => i >= 0);
  const done = total === 100;
  const over = total > 100;

  const splitEvenly = () => {
    const weights = evenWeights(included.length);
    included.forEach((rowIndex, i) =>
      setValue(`rows.${rowIndex}.weight`, weights[i], { shouldDirty: true, shouldValidate: true })
    );
  };

  return (
    <div className="min-w-0 flex-1 space-y-1.5" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={cn("font-medium", done ? "text-[#00695C]" : over ? "text-[#AD1F2A]" : "text-amber-700")}>
          Weights {total}% of 100%
        </span>
        {included.length > 1 && (
          <button type="button" onClick={splitEvenly} className="text-xs text-muted-foreground underline hover:text-foreground">
            Split evenly
          </button>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", done ? "bg-[#00695C]" : over ? "bg-[#AD1F2A]" : "bg-amber-500")}
          style={{ width: `${Math.min(total, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {done
          ? "Ready to publish."
          : over
            ? `${Math.round((total - 100) * 100) / 100}% too much.`
            : draftAllowed
              ? "Must total 100% to publish. Drafts can be saved as they are."
              : "Must total 100%."}
      </p>
    </div>
  );
}

/** The list of metric cards. */
export function TargetCards({
  control,
  metrics,
}: {
  control: Control<TargetFormValues>;
  metrics: FieldMetricDefinition[];
}) {
  const { fields } = useFieldArray({ control, name: "rows" });
  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <TargetCard key={field.id} control={control} index={index} metrics={metrics} initialNote={!!field.note} />
      ))}
    </div>
  );
}

/** An input with its unit inside the box, on the right. */
function SuffixInput({ suffix, className, ...props }: React.ComponentProps<typeof Input> & { suffix: string }) {
  return (
    <div className="relative">
      <Input {...props} className={cn(NO_SPINNER, "pr-16 tabular-nums", className)} />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}

/** One metric. Unticked, it's a single muted line; ticked, it opens to target, weight and an optional note. */
function TargetCard({
  control,
  index,
  metrics,
  initialNote,
}: {
  control: Control<TargetFormValues>;
  index: number;
  metrics: FieldMetricDefinition[];
  initialNote: boolean;
}) {
  const row = useWatch({ control, name: `rows.${index}` });
  const def = metrics.find((m) => m.key === row.metric_key);
  const [showNote, setShowNote] = useState(initialNote);
  const label = def?.label ?? row.metric_key;

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        row.included ? "border-foreground/20 bg-white shadow-xs" : "bg-muted/30"
      )}
    >
      <FormField
        control={control}
        name={`rows.${index}.included`}
        render={({ field }) => (
          <FormItem className="space-y-0">
            <label className="flex cursor-pointer items-start gap-3 p-4">
              <FormControl>
                <Checkbox
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-label={`Include ${label}`}
                />
              </FormControl>
              <span className="min-w-0">
                <span className={cn("block text-sm font-semibold", !row.included && "text-muted-foreground")}>
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground">{def?.description}</span>
              </span>
            </label>
          </FormItem>
        )}
      />

      {row.included && (
        <div className="space-y-3 border-t px-4 pb-4 pt-3 sm:pl-11">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={control}
              name={`rows.${index}.target`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Monthly target</FormLabel>
                  <FormControl>
                    <SuffixInput
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      placeholder="0"
                      suffix={UNIT_SHORT[def?.unit ?? ""] ?? def?.unit ?? ""}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`rows.${index}.weight`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Share of the score</FormLabel>
                  <FormControl>
                    <SuffixInput
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step="any"
                      placeholder="0"
                      suffix="%"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showNote ? (
            <FormField
              control={control}
              name={`rows.${index}.note`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Note for the worker</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Blocks A and B" maxLength={300} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add a note
            </button>
          )}
        </div>
      )}
    </div>
  );
}
