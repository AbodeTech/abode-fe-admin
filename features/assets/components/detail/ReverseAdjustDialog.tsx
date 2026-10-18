"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { formatNaira } from "@/lib/utils/format";

import {
  FINANCIAL_STAGE_LABELS,
  reverseEventFormSchema,
  type FinancialStage,
  type ReverseEventFormValues,
} from "../../schemas/asset-cost.schema";
import { useReverseEvent } from "../../hooks/use-cost-events";

interface Props {
  assetId: string;
  obligationId: string;
  eventId: string;
  stage: FinancialStage;
  currentAmount: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * POST /admin/cost-entries/:eventId/reverse — the only way to undo an
 * approved event. The backend keeps the original entry in the record, marks
 * it reversed and stores the reason; 409 `COST_EVENT_ALREADY_REVERSED` if it
 * was already reversed.
 */
export function ReverseAdjustDialog({ assetId, obligationId, eventId, stage, currentAmount, open, onOpenChange }: Props) {
  const reverse = useReverseEvent(assetId, obligationId, eventId);

  const form = useForm<ReverseEventFormValues>({
    resolver: zodResolver(reverseEventFormSchema),
    defaultValues: { reason: "" },
  });

  function close() {
    form.reset();
    onOpenChange(false);
  }

  const submit = form.handleSubmit((values) => {
    reverse.mutate(values, {
      onSuccess: () => {
        toast.success(`${FINANCIAL_STAGE_LABELS[stage]} reversed`);
        close();
      },
      onError: (error) => toast.error(error.message || "Couldn't reverse this entry"),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reverse {FINANCIAL_STAGE_LABELS[stage].toLowerCase()}</DialogTitle>
          <DialogDescription>
            This undoes an already-approved amount ({formatNaira(currentAmount)}) without erasing it. The
            original stays in the record as reversed and stops counting.
          </DialogDescription>
        </DialogHeader>

        <p className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          If this stage still needs to count against profit at a different amount, record a fresh stage entry
          after reversing this one.
        </p>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Reason</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Why is this being reversed?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={reverse.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={reverse.isPending}>
            {reverse.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Reverse"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
