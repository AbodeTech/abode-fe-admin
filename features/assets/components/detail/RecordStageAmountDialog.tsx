"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  FINANCIAL_STAGE_LABELS,
  addStageFormSchema,
  type AddStageFormValues,
  type FinancialStage,
} from "../../schemas/asset-cost.schema";
import { useAddStage } from "../../hooks/use-cost-events";
import { NumberInput } from "./OfferEditDialogs";

interface Props {
  assetId: string;
  obligationId: string;
  stage: FinancialStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * POST .../costs/:obligationId/stages — a new event, drafted, not
 * approved yet. 409 `COST_STAGE_DUPLICATE` if this same manual source
 * already recorded this stage.
 */
export function RecordStageAmountDialog({ assetId, obligationId, stage, open, onOpenChange }: Props) {
  const addStage = useAddStage(assetId, obligationId);

  const form = useForm<AddStageFormValues>({
    resolver: zodResolver(addStageFormSchema),
    defaultValues: {
      stage,
      amount: undefined as unknown as number,
      effective_date: new Date().toISOString().slice(0, 10),
      vendor: "",
      reference: "",
      note: "",
    },
  });

  function close() {
    form.reset();
    onOpenChange(false);
  }

  const submit = form.handleSubmit((values) => {
    const parsed = addStageFormSchema.parse(values);
    addStage.mutate(parsed, {
      onSuccess: () => {
        toast.success(`${FINANCIAL_STAGE_LABELS[stage]} recorded`);
        close();
      },
      onError: (error) => toast.error(error.message || "Couldn't record this stage"),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record {FINANCIAL_STAGE_LABELS[stage].toLowerCase()}</DialogTitle>
          <DialogDescription>
            This is a new draft entry — it needs approving before it counts against profit.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Amount</FormLabel>
                  <FormControl>
                    <NumberInput field={field} prefix="₦" min={0} />
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
                  <FormLabel className="text-xs">Effective date</FormLabel>
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
                  <FormLabel className="text-xs">Vendor / payee (optional)</FormLabel>
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
                  <FormLabel className="text-xs">Reference (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Work order, invoice or payment reference" {...field} />
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
                  <FormLabel className="text-xs">Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={addStage.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={addStage.isPending}>
            {addStage.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Record"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
