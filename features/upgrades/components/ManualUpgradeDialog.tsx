"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPicker } from "@/components/shared/UserPicker";
import { formatNaira } from "@/lib/utils/format";

import {
  MANUAL_UPGRADE_REASON_MIN,
  UPGRADE_TARGET_TIERS,
  USER_TIER_LABELS,
  manualUpgradeSchema,
  toManualUpgradePayload,
  type ManualUpgradeValues,
} from "../schemas/upgrade.schema";
import { useManualUpgrade } from "../hooks/use-manual-upgrade";

const EMPTY: ManualUpgradeValues = {
  user_id: "",
  to_tier: "associate-pro",
  fee_amount: "",
  pay_commission: false,
  reason: "",
};

/**
 * Record an upgrade that was paid for off-platform, or change a tier for free.
 *
 * The fee is optional and drives everything else: with a fee the BE writes a
 * Transaction so the money is in the ledger, and only then can commission be
 * paid. Without one this is a free tier change. That dependency is stated on
 * screen rather than left for the admin to discover from a payout that never
 * happened.
 *
 * No receipt upload, deliberately (ticket 15): when an admin records the
 * payment, the admin is the evidence and `reason` is the audit trail.
 */
export function ManualUpgradeDialog() {
  const [open, setOpen] = useState(false);
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const manualUpgrade = useManualUpgrade();

  const form = useForm<ManualUpgradeValues>({
    resolver: zodResolver(manualUpgradeSchema),
    defaultValues: EMPTY,
  });

  const fee = useWatch({ control: form.control, name: "fee_amount" }) ?? "";
  const reason = useWatch({ control: form.control, name: "reason" }) ?? "";
  const feeValue = fee === "" ? 0 : Number(fee);
  const hasFee = Number.isFinite(feeValue) && feeValue > 0;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(EMPTY);
      setPickedLabel(null);
    }
  };

  function onSubmit(values: ManualUpgradeValues) {
    manualUpgrade.mutate(
      { userId: values.user_id, payload: toManualUpgradePayload(values) },
      {
        onSuccess: () => {
          toast.success(
            hasFee
              ? `Upgrade recorded — ${formatNaira(feeValue)} added to the ledger`
              : "Tier changed"
          );
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message || "Failed to record the upgrade"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-1 h-4 w-4" />
          Record upgrade
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a manual upgrade</DialogTitle>
          <DialogDescription>
            For an upgrade paid off-platform, or a tier change granted directly. It lands in the
            queue already approved, under your name.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who to upgrade</FormLabel>
                  <FormControl>
                    <UserPicker
                      value={field.value}
                      onChange={(userId, option) => {
                        field.onChange(userId);
                        setPickedLabel(option?.label ?? null);
                      }}
                      disabled={manualUpgrade.isPending}
                      fallbackLabel={pickedLabel}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New tier</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={manualUpgrade.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UPGRADE_TARGET_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {USER_TIER_LABELS[tier]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fee_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee paid (₦)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="Leave blank for a free tier change"
                      disabled={manualUpgrade.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {hasFee
                      ? `Records ${formatNaira(feeValue)} as received and writes it to the ledger.`
                      : "No fee recorded — the tier changes and no money is booked."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pay_commission"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={manualUpgrade.isPending || !hasFee}
                        aria-describedby="pay-commission-help"
                      />
                    </FormControl>
                    <div className="min-w-0 space-y-1">
                      <FormLabel className="font-normal">
                        Pay referral commission on this fee
                      </FormLabel>
                      <p id="pay-commission-help" className="text-xs text-muted-foreground">
                        {hasFee
                          ? "Pays their referrer at the configured upgrade rate. Nothing is paid if they have no referrer."
                          : "Needs a fee above zero — commission is a percentage of it."}
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Explain what you are recording — for example, paid ₦20,000 by bank transfer on 8 August, reference GTB-88213, confirmed against the statement."
                      disabled={manualUpgrade.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Stored on the audit log — this is the only record of why. At least{" "}
                    {MANUAL_UPGRADE_REASON_MIN} characters — {reason.trim().length} so far.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasFee ? (
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Recording a fee needs the user to have a wallet. Without one the request fails with
                &ldquo;User has no wallet&rdquo;.
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={manualUpgrade.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={manualUpgrade.isPending}>
                {manualUpgrade.isPending ? (
                  <>
                    Recording <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Record upgrade"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
