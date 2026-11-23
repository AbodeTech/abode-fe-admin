"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/shared/MoneyInput";

import type { RecoveryDetail } from "../schemas/recovery-window.schema";
import {
  useAdjustRecoveryRefund,
  useApproveRecoveryRefund,
  useHoldRecoveryRefund,
  useReleaseRecoveryRefund,
} from "../hooks/use-recovery-actions";
import { errorText, longDate, naira } from "./format";

const ERRORS: Record<string, string> = {
  REFUND_NOT_PENDING: "This refund is no longer waiting for approval. Refresh the page.",
  REFUND_AMOUNT_ZERO: "There's nothing to refund.",
  REFUND_AMOUNT_OUT_OF_RANGE: "A refund can't be more than what was paid on the land.",
  RECOVERY_WINDOW_STALE_STATE: "Someone else changed this record. Refresh the page and check again.",
};
const refundError = (err: unknown, fallback: string) => errorText(err, ERRORS, fallback);

type Mode = "approve" | "adjust" | "hold" | "release" | null;

interface Props {
  record: RecoveryDetail;
  canApprove: boolean;
}

/** How the refund is worked out, and finance's actions on it. */
export function RefundPanel({ record, canApprove }: Props) {
  const ending = record.ending;
  const [mode, setMode] = useState<Mode>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const approve = useApproveRecoveryRefund();
  const adjust = useAdjustRecoveryRefund();
  const hold = useHoldRecoveryRefund();
  const release = useReleaseRecoveryRefund();

  if (!ending) return null;
  const refund = ending.refund_final ?? ending.refund_amount;
  const isFo = record.plan_type !== "flex";
  const pending = record.stage === "refund_pending";
  const onHold = record.stage === "refund_on_hold";
  const paid = record.stage === "ended_refund";
  const busy = approve.isPending || adjust.isPending || hold.isPending || release.isPending;

  const close = () => {
    setMode(null);
    setReason("");
    setAmount("");
  };

  const run = async () => {
    try {
      if (mode === "approve") {
        await approve.mutateAsync({ id: record.id, expected_updated_at: record.updated_at ?? undefined });
        toast.success(`Refund approved. It's now on Transactions › Refunds, ready to send.`);
      } else if (mode === "adjust") {
        await adjust.mutateAsync({
          id: record.id,
          amount: Number(amount.replace(/,/g, "")),
          reason: reason.trim(),
          expected_updated_at: record.updated_at ?? undefined,
        });
        toast.success("Refund amount changed");
      } else if (mode === "hold") {
        await hold.mutateAsync({ id: record.id, reason: reason.trim() });
        toast.success("Refund put on hold");
      } else if (mode === "release") {
        await release.mutateAsync({ id: record.id, reason: reason.trim() });
        toast.success("Refund taken off hold");
      }
      close();
    } catch (err) {
      toast.error(refundError(err, "That didn't work. Try again."));
    }
  };

  const needsReason = mode === "adjust" || mode === "hold" || mode === "release";
  const canRun =
    !busy &&
    (!needsReason || reason.trim().length >= 15) &&
    (mode !== "adjust" || amount.trim().length > 0);

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            {ending.refund_amount > 0 || ending.refund_final ? "How the refund is worked out" : "How the plan ended"}
          </h2>
          <span className="text-xs text-muted-foreground">Frozen when the plan ended · {longDate(ending.ended_at)}</span>
        </div>
        <div className="divide-y rounded-lg border text-sm tabular-nums">
          <Line label="Land price" value={naira(ending.land_price)} />
          <Line
            label="Paid on land"
            value={`${naira(ending.land_paid)} · ${Math.round(ending.share_paid_pct)}% ${ending.share_paid_pct > 30 ? "· above 30%" : "· 30% or less"}`}
          />
          {ending.admin_charge ? (
            <Line label="Admin charge · 20% of land price" value={`− ${naira(ending.admin_charge)}`} />
          ) : null}
          {isFo && ending.default_fee_deducted ? (
            <Line label="Default fee (unpaid)" value={`− ${naira(ending.default_fee_deducted)}`} />
          ) : null}
          {isFo && ending.default_fee_waived ? (
            <Line label="Default fee let go" value={naira(ending.default_fee_waived)} />
          ) : null}
          <Line label="Refund" value={naira(refund)} strong />
        </div>
        {ending.refund_final != null ? (
          <p className="text-sm text-amber-800">
            Changed from {naira(ending.refund_amount)}: {ending.adjust_reason}
          </p>
        ) : null}
        {onHold ? (
          <p className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
            On hold: {ending.hold_reason}. The customer sees “We’re checking your refund”.
          </p>
        ) : null}
        {paid ? <PayoutStatus record={record} refund={refund} /> : null}
        {record.stage === "ended_no_refund" ? (
          <p className="text-sm text-muted-foreground">
            {ending.no_refund_reason === "charges_exceed_paid"
              ? "The admin charge and default fee used up what was paid, so nothing is refunded."
              : "Plans that end with 30% or less of the land price paid get no refund."}{" "}
            The customer owes nothing more.
          </p>
        ) : null}

        {canApprove && (pending || onHold) ? (
          <div className="flex flex-wrap gap-2">
            {pending ? (
              <Button onClick={() => setMode("approve")} disabled={!(refund > 0)}>
                Approve refund · {naira(refund)}
              </Button>
            ) : (
              <Button onClick={() => setMode("release")}>Take off hold</Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setAmount(refund.toLocaleString("en-NG"));
                setMode("adjust");
              }}
            >
              Change the amount
            </Button>
            {pending ? (
              <Button variant="outline" onClick={() => setMode("hold")}>
                Put on hold
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "approve"
                ? `Approve ${naira(refund)} refund?`
                : mode === "adjust"
                  ? "Change the refund amount"
                  : mode === "hold"
                    ? "Put the refund on hold"
                    : "Take the refund off hold"}
            </DialogTitle>
            <DialogDescription>
              {record.customer_name} · {record.asset_name}
            </DialogDescription>
          </DialogHeader>
          {mode === "approve" ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-md bg-muted/50 p-3 leading-relaxed">
                <strong>Approving will:</strong>
                <br />· fix the refund at {naira(refund)}, owed to the customer’s bank account
                <br />· keep the {naira(ending.admin_charge)} admin charge
                {isFo && ending.default_fee_deducted ? ` and ${naira(ending.default_fee_deducted)} default fee` : ""}
                <br />· put it on Transactions › Refunds, where it’s sent to their bank
                <br />· email the customer that it’s approved
              </div>
              <p className="text-muted-foreground">
                Nothing goes into their Abode wallet. This can’t be undone here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mode === "adjust" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Refund amount (up to {naira(ending.land_paid)})</Label>
                  <MoneyInput value={amount} onChange={setAmount} />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Reason (at least 15 characters, saved to the admin log)</Label>
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={run} disabled={!canRun}>
              {busy ? "Working…" : mode === "approve" ? "Approve refund" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Where the approved refund is: owed, with Paystack, failed, or paid to the bank. */
function PayoutStatus({ record, refund }: { record: RecoveryDetail; refund: number }) {
  const p = record.refund_payout;
  // Refunds approved before payouts existed went to the wallet.
  if (!p) {
    return (
      <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
        {naira(refund)} credited to the customer’s Abode wallet on {longDate(record.ending?.approved_at)}.
      </p>
    );
  }
  const account = p.bank_name ? `${p.bank_name} ••${(p.account_number ?? "").slice(-4)}` : null;
  const tone =
    p.status === "paid"
      ? "border-green-200 bg-green-50 text-green-900"
      : p.status === "retry_needed"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-blue-200 bg-blue-50 text-blue-900";
  const text =
    p.status === "paid"
      ? `${naira(p.amount)} paid to ${account ?? "the customer’s bank"} on ${longDate(p.paid_at)}${p.method === "manual" ? ` by hand · ref ${p.reference}` : ""}.`
      : p.status === "processing"
        ? `${naira(p.amount)} is with Paystack, on its way to ${account}. Sent ${longDate(p.sent_at)}.`
        : p.status === "retry_needed"
          ? `The transfer to ${account ?? "the customer’s bank"} didn’t go through${p.last_error ? `: ${p.last_error}` : ""}. It’s still owed. Send it again from Refunds.`
          : !p.has_bank_details
            ? `${naira(p.amount)} approved and owed, but the customer has no bank account saved. They’ve been asked to add one.`
            : `${naira(p.amount)} approved and waiting to be sent to ${account}.`;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm ${tone}`}>
      <p>{text}</p>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/transactions/refunds?search=${encodeURIComponent(record.customer_email ?? record.customer_name ?? "")}`}>
          Open in Refunds
        </Link>
      </Button>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
