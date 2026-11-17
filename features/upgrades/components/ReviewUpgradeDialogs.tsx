"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { DECLINE_REASON_PRESETS } from "@/lib/decline-reasons";
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
import { isUpgradeNoLongerPending, useApproveUpgrade, useDeclineUpgrade } from "../hooks/use-upgrade-review";

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
      onError: (error) => {
        toast.error(error.message || "Failed to approve upgrade");
        // Someone else decided it first; nothing left to decide here.
        if (isUpgradeNoLongerPending(error)) onOpenChange(false);
      },
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

const OTHER_REASON = "__other__";

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

  // Which dropdown option is picked: a preset, OTHER_REASON, or "" (nothing yet).
  const [choice, setChoice] = useState("");

  // Start each newly opened upgrade with nothing picked (reset during render,
  // not in an effect, per React's "adjusting state when a prop changes").
  const [choiceFor, setChoiceFor] = useState(upgrade);
  if (choiceFor !== upgrade) {
    setChoiceFor(upgrade);
    setChoice("");
  }

  const { reset } = form;
  useEffect(() => {
    if (upgrade) reset({ reason: "" });
  }, [upgrade, reset]);

  // `useWatch` rather than `form.watch()` — the latter returns a fresh function
  // each render, which makes React Compiler skip memoising this component.
  const reason = useWatch({ control: form.control, name: "reason" }) ?? "";

  const isOther = choice === OTHER_REASON;

  const handleChoiceChange = (value: string) => {
    setChoice(value);
    // A preset is the reason as-is; "Other" starts from an empty box to type in.
    form.setValue("reason", value === OTHER_REASON ? "" : value, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  };

  if (!upgrade) return null;

  function onSubmit(values: DeclineUpgradeValues) {
    decline.mutate(
      { upgradeId: upgrade!._id, reason: values.reason },
      {
        onSuccess: () => {
          toast.success("Upgrade declined");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to decline upgrade");
          if (isUpgradeNoLongerPending(error)) onOpenChange(false);
        },
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
          {/* min-w-0: the dialog is a grid, and without it a long selected
              reason stretches the form past the dialog's edge. */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decline-preset">Choose a reason</Label>
              <Select value={choice} onValueChange={handleChoiceChange} disabled={decline.isPending}>
                <SelectTrigger
                  id="decline-preset"
                  className="w-full min-w-0 *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate"
                >
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                {/* popper: open directly under the trigger at its width, rather
                    than shifting to overlay the selected item. */}
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-(--radix-select-trigger-width) max-h-80"
                >
                  {[...DECLINE_REASON_PRESETS, OTHER_REASON].map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                      // Striped like the tables, with a divider, so each
                      // multi-line option reads as its own row.
                      className="rounded-none border-b py-2.5 leading-snug whitespace-normal last:border-b-0 even:bg-muted/50 focus:bg-accent data-[state=checked]:font-medium"
                    >
                      {value === OTHER_REASON ? "Custom" : value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isOther && form.formState.errors.reason ? (
                <p className="text-sm text-destructive">Choose a reason for declining</p>
              ) : null}
            </div>

            {isOther ? (
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        autoFocus
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
            ) : null}

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
