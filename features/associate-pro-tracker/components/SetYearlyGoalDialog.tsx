"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";

import { useUpsertYearlyGoal } from "../hooks/use-upsert-yearly-goal";
import { useYearlyGoal } from "../hooks/use-yearly-goal";
import {
  upsertYearlyGoalSchema,
  type UpsertYearlyGoalPayload,
} from "../schemas/tracker.schema";

interface Props {
  year: number;
  /** `edit` pre-fills from the stored goal; `create` starts blank. */
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * One dialog for both setting and revising a year's goals — the BE has a single
 * upsert route, and the two forms would otherwise be identical.
 *
 * Revising is allowed all year and never locked; the BE audits each change with
 * before and after, so a mid-year correction is a normal action rather than an
 * exception the UI should discourage.
 */
export function SetYearlyGoalDialog({ year, mode, open, onOpenChange }: Props) {
  const { data: existing } = useYearlyGoal(year, { enabled: open && mode === "edit" });
  const { mutateAsync: upsertGoal, isPending } = useUpsertYearlyGoal(year);

  const form = useForm<UpsertYearlyGoalPayload>({
    resolver: zodResolver(upsertYearlyGoalSchema),
    defaultValues: { associate_pro_target: 0, revenue_target: 0, notes: "" },
  });

  // The stored goal arrives after the dialog opens, so the form is filled when
  // it lands rather than at mount.
  useEffect(() => {
    if (!open) return;
    form.reset({
      associate_pro_target: existing?.associate_pro_target ?? 0,
      revenue_target: existing?.revenue_target ?? 0,
      notes: existing?.notes ?? "",
    });
  }, [open, existing, form]);

  const onSubmit = async (values: UpsertYearlyGoalPayload) => {
    try {
      await upsertGoal({
        ...values,
        // An empty textarea is "no note", not an empty note.
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
      });
      toast.success(mode === "create" ? `Goals set for ${year}` : `Goals updated for ${year}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save the goals");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? `Set goals for ${year}` : `Edit goals for ${year}`}
          </DialogTitle>
          <DialogDescription>
            Targets drive the progress bars. Everything else on this page is
            measured live and does not depend on them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="associate_pro_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associate Pro target</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="e.g. 2000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revenue_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue target (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 500000000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Why these targets, or what changed"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {mode === "create" ? "Set goals" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
