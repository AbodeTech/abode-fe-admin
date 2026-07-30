"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { formatNaira } from "@/lib/utils/format";

import {
  DECLINE_REASON_MIN,
  USER_TIER_LABELS,
  declineUpgradeSchema,
  personId,
  personName,
  type DeclineUpgradeValues,
  type Upgrade,
} from "../schemas/upgrade.schema";
import { useApproveUpgrade, useDeclineUpgrade } from "../hooks/use-upgrade-review";

function Summary({ upgrade }: { upgrade: Upgrade }) {
  return (
    <span className="mt-1 block rounded-md border bg-muted/40 p-3 text-sm">
      <span className="block font-medium text-foreground">
        <UnresolvedRef
          name={personName(upgrade.user)}
          id={personId(upgrade.user)}
          kind="applicant"
        />
      </span>
      <span className="block text-muted-foreground">
        {USER_TIER_LABELS[upgrade.from_tier]} → {USER_TIER_LABELS[upgrade.to_tier]} ·{" "}
        {formatNaira(upgrade.fee_amount)}
      </span>
    </span>
  );
}

/* -------------------- approve -------------------- */

export function ApproveUpgradeDialog({
  upgrade,
  onOpenChange,
}: {
  upgrade: Upgrade | null;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useApproveUpgrade();

  if (!upgrade) return null;

  const handleApprove = () => {
    approve.mutate(upgrade._id, {
      onSuccess: () => {
        toast.success("Upgrade approved");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message || "Failed to approve upgrade"),
    });
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve this upgrade?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <Summary upgrade={upgrade} />

              <p>Approving does three things at once, and they cannot be undone from here:</p>

              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Moves the applicant to <strong>{USER_TIER_LABELS[upgrade.to_tier]}</strong>
                </li>
                <li>Marks the payment transaction complete</li>
                <li>
                  {upgrade.coupon_code_snapshot
                    ? "Pays no referral commission — this upgrade used a coupon"
                    : "Pays referral commission to their referrer"}
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={approve.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleApprove();
            }}
            disabled={approve.isPending}
          >
            {approve.isPending ? (
              <>
                Approving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Approve upgrade"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* -------------------- decline -------------------- */

export function DeclineUpgradeDialog({
  upgrade,
  onOpenChange,
}: {
  upgrade: Upgrade | null;
  onOpenChange: (open: boolean) => void;
}) {
  const decline = useDeclineUpgrade();

  const form = useForm<DeclineUpgradeValues>({
    resolver: zodResolver(declineUpgradeSchema),
    defaultValues: { reason: "" },
  });

  const { reset } = form;
  useEffect(() => {
    if (upgrade) reset({ reason: "" });
  }, [upgrade, reset]);

  // `useWatch` rather than `form.watch()` — the latter returns a fresh function
  // each render, which makes React Compiler skip memoising this component.
  const reason = useWatch({ control: form.control, name: "reason" }) ?? "";

  if (!upgrade) return null;

  function onSubmit(values: DeclineUpgradeValues) {
    decline.mutate(
      { upgradeId: upgrade!._id, reason: values.reason },
      {
        onSuccess: () => {
          toast.success("Upgrade declined");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message || "Failed to decline upgrade"),
      }
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Decline this upgrade</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm">
              <Summary upgrade={upgrade} />
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Explain what was wrong — for example, the transfer reference doesn't match any payment we received."
                      disabled={decline.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The applicant sees this, so write it for them. At least {DECLINE_REASON_MIN}{" "}
                    characters — {reason.trim().length} so far.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={decline.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={decline.isPending}>
                {decline.isPending ? (
                  <>
                    Declining <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Decline upgrade"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
