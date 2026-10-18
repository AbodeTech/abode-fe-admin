"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  isGroundConfirmed,
  submitGroundConfirmationFormSchema,
  type SubmitGroundConfirmationFormValues,
} from "../../schemas/ground-confirmation.schema";
import { useGroundConfirmationHistory } from "../../hooks/use-ground-confirmation";
import { useSubmitGroundConfirmation, useVerifyGroundConfirmation } from "../../hooks/use-ground-confirmation-mutations";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function GroundConfirmationDialogBody({ assetId, plotId, planId }: { assetId: string; plotId: string; planId: string }) {
  const { data: history, isLoading, isError } = useGroundConfirmationHistory(plotId, { planId });
  const submit = useSubmitGroundConfirmation(assetId, plotId);
  const verify = useVerifyGroundConfirmation(assetId, plotId);
  const form = useForm<SubmitGroundConfirmationFormValues>({
    resolver: zodResolver(submitGroundConfirmationFormSchema),
    defaultValues: { notes: "" },
  });

  const pending = history?.find((entry) => entry.verified_at === null) ?? null;

  const onSubmit = form.handleSubmit((values) => {
    submit.mutate(values, {
      onSuccess: () => {
        toast.success("Ground confirmation submitted — pending verification");
        form.reset({ notes: "" });
      },
      onError: (error) => toast.error(error.message || "Couldn't submit this confirmation"),
    });
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load this plot’s ground confirmation.</p>
      ) : history && history.length > 0 ? (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li key={entry._id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {entry.verified_at ? (
                    <Badge className="gap-1">
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending verification</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {entry.submitted_by} · {formatDate(entry.submitted_at)}
                  </span>
                </span>
                {!entry.verified_at ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={verify.isPending}
                    onClick={() =>
                      verify.mutate(entry._id, {
                        onSuccess: () => toast.success("Ground confirmation verified"),
                        onError: (error) => toast.error(error.message || "Couldn't verify this confirmation"),
                      })
                    }
                  >
                    {verify.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Verify
                  </Button>
                ) : null}
              </div>
              {entry.notes ? <p className="mt-1 text-xs text-muted-foreground">{entry.notes}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No ground confirmation submitted yet.</p>
      )}

      {!isLoading && !isError && !pending && !isGroundConfirmed(history ?? []) ? (
        <Form {...form}>
          <div className="space-y-3 border-t pt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Record an on-site confirmation</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="e.g. Plot staked and handed over on site" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" size="sm" onClick={onSubmit} disabled={submit.isPending}>
              {submit.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Submit confirmation
            </Button>
          </div>
        </Form>
      ) : null}
    </div>
  );
}

/**
 * "Separate system allocation from ground confirmation" — a real, independent
 * per-plot status (see ground-confirmation.schema.ts), not just the
 * "System allocated" relabel. Only meaningful for an already-allocated plot.
 *
 * Derives its own `groundConfirmed` label from this plot's own history query
 * rather than taking it as a prop — the plot-inventory list response this
 * badge is rendered from (the real `GET .../plots`) carries no such field at
 * all, so there is nothing for a caller to pass down.
 */
export function GroundConfirmationBadge({ assetId, plotId, planId }: { assetId: string; plotId: string; planId: string }) {
  const [open, setOpen] = useState(false);
  const { data: history, isLoading, isError } = useGroundConfirmationHistory(plotId, { planId });
  const groundConfirmed = isGroundConfirmed(history ?? []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        <Badge
          variant="outline"
          className={groundConfirmed ? "gap-1 text-emerald-700" : "gap-1 text-muted-foreground"}
        >
          {groundConfirmed ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : null}
          {isLoading ? "Checking…" : isError ? "Status unavailable" : groundConfirmed ? "Ground confirmed" : "Not ground confirmed"}
        </Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ground confirmation</DialogTitle>
            <DialogDescription>
              An admin records an on-site confirmation for this plot, then verifies it. This is separate from its
              &ldquo;System allocated&rdquo; database status.
            </DialogDescription>
          </DialogHeader>
          {open ? <GroundConfirmationDialogBody assetId={assetId} plotId={plotId} planId={planId} /> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
