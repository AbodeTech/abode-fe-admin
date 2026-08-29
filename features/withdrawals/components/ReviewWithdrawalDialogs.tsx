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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { formatNaira } from "@/lib/utils/format";

import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABELS,
  WITHDRAWAL_REASON_MIN,
  bankDetailsId,
  bankDetailsLabel,
  bankDetailsSubtitle,
  personId,
  personName,
  withdrawalReasonSchema,
  type PaymentProvider,
  type Withdrawal,
} from "../schemas/withdrawal.schema";
import {
  useApproveWithdrawal,
  useDeclineWithdrawal,
  useRetryWithdrawal,
  type ApproveResult,
} from "../hooks/use-withdrawal-review";

/* ============================================================
 * The three review actions. One open dialog at a time, owned by the page.
 *
 * Approve and retry share a truth-telling rule: the endpoint 200s even when
 * the payment rail refuses the transfer, and the row lands in
 * `approved-retry-needed` with no money moved. So success toasts are decided
 * by the `admin_status` that comes back, never by the HTTP status.
 * ============================================================ */

export type ReviewAction =
  | { kind: "approve"; row: Withdrawal }
  | { kind: "decline"; row: Withdrawal }
  | { kind: "retry"; row: Withdrawal };

function railOutcomeToast(result: ApproveResult, verb: string) {
  if (result.admin_status === "approved-retry-needed") {
    const lastError = result.rail_attempts?.[result.rail_attempts.length - 1]?.error.message;
    toast.warning(
      `${verb} recorded, but the transfer was refused${lastError ? `: ${lastError}` : ""}. ` +
        "No money has moved — the withdrawal is in the retry queue."
    );
    return;
  }
  toast.success(`${verb} — transfer initiated`);
}

function Destination({ row }: { row: Withdrawal }) {
  const label = bankDetailsLabel(row.bank_details_id);
  const subtitle = bankDetailsSubtitle(row.bank_details_id);
  return (
    <div className="min-w-0 text-right space-y-0.5">
      <UnresolvedRef
        name={label}
        id={bankDetailsId(row.bank_details_id)}
        kind="bank account"
      />
      {subtitle ? (
        <p className="font-mono text-xs text-muted-foreground tabular-nums">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Summary({ row }: { row: Withdrawal }) {
  return (
    <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-medium tabular-nums">{formatNaira(row.amount)}</span>
      </div>
      {typeof row.total_debited === "number" && row.total_debited !== row.amount ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Total debited (incl. fee)</span>
          <span className="tabular-nums">{formatNaira(row.total_debited)}</span>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground">Requested by</span>
        <UnresolvedRef name={personName(row.user)} id={personId(row.user)} kind="requester" />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground">Destination account</span>
        <Destination row={row} />
      </div>
    </div>
  );
}

function ProviderPicker({
  row,
  value,
  onChange,
}: {
  row: Withdrawal;
  value: PaymentProvider | "";
  onChange: (next: PaymentProvider | "") => void;
}) {
  const current = row.payment_provider;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        Payment rail{current ? ` — currently ${PAYMENT_PROVIDER_LABELS[current]}` : ""}
      </p>
      <Select
        value={value || "keep"}
        onValueChange={(next) => onChange(next === "keep" ? "" : (next as PaymentProvider))}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="keep">
            Keep {current ? PAYMENT_PROVIDER_LABELS[current] : "the default"}
          </SelectItem>
          {PAYMENT_PROVIDERS.filter((provider) => provider !== current).map((provider) => (
            <SelectItem key={provider} value={provider}>
              Switch to {PAYMENT_PROVIDER_LABELS[provider]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ReviewWithdrawalDialogs({
  action,
  onClose,
}: {
  action: ReviewAction | null;
  onClose: () => void;
}) {
  const approve = useApproveWithdrawal();
  const decline = useDeclineWithdrawal();
  const retry = useRetryWithdrawal();

  const [overrideProvider, setOverrideProvider] = useState<PaymentProvider | "">("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const pending = approve.isPending || decline.isPending || retry.isPending;

  const close = () => {
    setOverrideProvider("");
    setReason("");
    setReasonError(null);
    onClose();
  };

  const fail = (error: Error) => toast.error(error.message || "The action failed");

  if (!action) return null;
  const { row } = action;

  const validReason = (): string | null => {
    const parsed = withdrawalReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? "Enter a reason");
      return null;
    }
    setReasonError(null);
    return parsed.data;
  };

  const submit = () => {
    if (action.kind === "approve") {
      approve.mutate(
        { id: row._id, overrideProvider: overrideProvider || undefined },
        {
          onSuccess: (result) => {
            railOutcomeToast(result, "Approved");
            close();
          },
          onError: fail,
        }
      );
      return;
    }

    const parsedReason = validReason();
    if (!parsedReason) return;

    if (action.kind === "decline") {
      decline.mutate(
        { id: row._id, reason: parsedReason },
        {
          onSuccess: (result) => {
            toast.success(
              result.released
                ? "Declined — the held funds are back in the user's wallet"
                : "Declined"
            );
            close();
          },
          onError: fail,
        }
      );
      return;
    }

    retry.mutate(
      { id: row._id, reason: parsedReason, overrideProvider: overrideProvider || undefined },
      {
        onSuccess: (result) => {
          railOutcomeToast(result, "Retried");
          close();
        },
        onError: fail,
      }
    );
  };

  const copy = {
    approve: {
      title: "Approve withdrawal",
      description:
        "Approving sends the money — it initiates the bank transfer immediately, not just a status change.",
      cta: "Approve and transfer",
    },
    decline: {
      title: "Decline withdrawal",
      description:
        "Declining releases the held funds back to the user's wallet balance. The reason is recorded and logged.",
      cta: "Decline",
    },
    retry: {
      title: "Retry transfer",
      description:
        "The rail refused the previous attempt. This tries again — optionally on the other provider.",
      cta: "Retry transfer",
    },
  }[action.kind];

  const needsReason = action.kind !== "approve";
  const needsProvider = action.kind !== "decline";

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Summary row={row} />

          {action.kind === "retry" && row.rail_attempts.length > 0 ? (
            <div className="space-y-1.5 rounded-md border border-dashed p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Previous attempts
              </p>
              {row.rail_attempts.map((attempt, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  {PAYMENT_PROVIDER_LABELS[attempt.provider]}: {attempt.error.message}
                  {attempt.error.retryable ? "" : " (marked non-retryable)"}
                </p>
              ))}
            </div>
          ) : null}

          {needsProvider ? (
            <ProviderPicker row={row} value={overrideProvider} onChange={setOverrideProvider} />
          ) : null}

          {needsReason ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Reason — at least {WITHDRAWAL_REASON_MIN} characters, shown in the admin log
              </p>
              <Textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  action.kind === "decline"
                    ? "Why this withdrawal is being refused"
                    : "Why the transfer is being retried"
                }
                aria-invalid={Boolean(reasonError)}
              />
              {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={action.kind === "decline" ? "destructive" : "default"}
            onClick={submit}
            disabled={pending}
          >
            {pending ? (
              <>
                Working <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              copy.cta
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
