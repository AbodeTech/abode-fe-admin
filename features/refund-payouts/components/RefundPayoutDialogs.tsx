"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira } from "@/lib/utils/format";

import { errorText } from "@/features/recovery-windows/components/format";

import { useMarkRefundPayoutPaid, useSendRefundPayout } from "../hooks/use-refund-payouts";
import type { RefundPayout } from "../schemas/refund-payout.schema";

/* ============================================================
 * Send to bank (also the retry) and Mark paid by hand. One open at a time,
 * owned by the page.
 *
 * As on Withdrawals, sending returns 200 even when Paystack refuses the
 * transfer: the row comes back `retry_needed` and no money has moved. The toast
 * reads the returned status, never the HTTP one.
 * ============================================================ */

export type RefundPayoutAction = { kind: "send" | "mark_paid"; row: RefundPayout };

const ERRORS: Record<string, string> = {
  REFUND_PAYOUT_NO_BANK_DETAILS:
    "The customer has no bank account saved. They've been emailed to add one; pay by hand meanwhile if you have their details.",
  REFUND_PAYOUT_NOT_SENDABLE: "This refund was already sent or paid. Refresh the page.",
  REFUND_PAYOUT_STATE_CHANGED: "Someone else just sent this refund. Refresh the page.",
  REFUND_PAYOUT_NOT_MARKABLE: "It's with Paystack, so it settles by itself. If it fails, you can then pay it by hand.",
  REFUND_PAYOUT_REFERENCE_REQUIRED: "Enter the bank transfer reference.",
};

function Summary({ row }: { row: RefundPayout }) {
  const lines: [string, string][] = [
    ["Amount", formatNaira(row.amount)],
    ["Customer", row.customer_name ?? "—"],
    ["Plan", `${row.asset_name ?? "—"}${row.size_sqm ? ` · ${row.size_sqm} sqm` : ""}`],
    [
      "To",
      row.bank ? `${row.bank.bank_name} · ${row.bank.account_number} · ${row.bank.account_name}` : "No bank account saved",
    ],
  ];
  return (
    <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
      {lines.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-right font-medium tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function RefundPayoutDialogs({
  action,
  onClose,
}: {
  action: RefundPayoutAction | null;
  onClose: () => void;
}) {
  const send = useSendRefundPayout();
  const markPaid = useMarkRefundPayoutPaid();
  const [reference, setReference] = useState("");
  // The page keys this component by action, so the fields start empty for each one.
  const [note, setNote] = useState("");

  const row = action?.row;
  const busy = send.isPending || markPaid.isPending;
  const retry = row?.status === "retry_needed";

  const run = async () => {
    if (!action || !row) return;
    try {
      if (action.kind === "send") {
        const result = await send.mutateAsync({ id: row.id });
        if (result.status === "retry_needed") {
          toast.warning(
            `Paystack didn't take the transfer${result.last_error ? `: ${result.last_error}` : ""}. No money has moved; it's still owed.`
          );
        } else {
          toast.success(`${formatNaira(row.amount)} sent to Paystack. It shows as paid when the bank confirms.`);
        }
      } else {
        await markPaid.mutateAsync({ id: row.id, reference: reference.trim(), note: note.trim() || undefined });
        toast.success("Marked paid. The customer has been emailed.");
      }
      onClose();
    } catch (err) {
      toast.error(errorText(err, ERRORS, "That didn't work. Try again."));
    }
  };

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        {action && row ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {action.kind === "send"
                  ? retry
                    ? "Retry the refund transfer"
                    : "Send the refund to the bank"
                  : "Mark the refund paid by hand"}
              </DialogTitle>
              <DialogDescription>
                {action.kind === "send"
                  ? "Paystack pays it straight to this account. Nothing goes through the customer's wallet."
                  : "Only for a refund you've already paid outside the app, from the company account."}
              </DialogDescription>
            </DialogHeader>

            <Summary row={row} />

            {retry && row.last_error ? (
              <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Last try: {row.last_error}
              </p>
            ) : null}

            {action.kind === "mark_paid" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Bank transfer reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="As it shows on the statement" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Note (optional)</Label>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={run}
                disabled={busy || (action.kind === "mark_paid" && reference.trim().length < 4)}
              >
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {action.kind === "send" ? `Send ${formatNaira(row.amount)}` : "Mark paid"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
