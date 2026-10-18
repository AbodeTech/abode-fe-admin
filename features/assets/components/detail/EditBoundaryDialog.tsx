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
import { Textarea } from "@/components/ui/textarea";

import { useSetBoundary } from "../../hooks/use-site-setup-mutations";
import {
  setBoundaryFormSchema,
  type CurrentBoundary,
  type SetBoundaryFormValues,
} from "../../schemas/site-setup.schema";
import { NumberInput } from "./NumberInput";

interface FormProps {
  assetId: string;
  current: CurrentBoundary | null;
  onClose: () => void;
}

function EditBoundaryForm({ assetId, current, onClose }: FormProps) {
  const save = useSetBoundary(assetId);

  const form = useForm<SetBoundaryFormValues>({
    resolver: zodResolver(setBoundaryFormSchema),
    defaultValues: {
      front: current?.sides.front,
      right: current?.sides.right,
      back: current?.sides.back,
      left: current?.sides.left,
      note: current?.note ?? "",
    },
  });

  const submit = form.handleSubmit((values) => {
    save.mutate(values, {
      onSuccess: () => {
        toast.success("Boundary saved — fencing progress is now measured against it");
        onClose();
      },
      onError: (error) => toast.error(error.message || "Couldn't save this boundary"),
    });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{current ? "Edit approved boundary" : "Set approved boundary"}</DialogTitle>
        <DialogDescription>
          This becomes the new current version — fencing progress on every side is measured against
          it from now on. The previous version stays in history.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Front</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="m" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="right"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Right</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="m" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Back</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="m" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="left"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Left</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="m" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Note (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="e.g. From the approved survey plan of March 2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={save.isPending}>
          {save.isPending ? (
            <>
              Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            "Save boundary"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

interface Props {
  assetId: string;
  current: CurrentBoundary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBoundaryDialog({ assetId, current, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <EditBoundaryForm
            key={current?.version ?? "new"}
            assetId={assetId}
            current={current}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
