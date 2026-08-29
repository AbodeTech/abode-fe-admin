"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { formatNaira } from "@/lib/utils/format";

import {
  PURCHASE_DECLINE_REASON_MIN,
  assetId,
  assetName,
  buyerId,
  buyerName,
  isInitialPurchase,
  kindLabel,
  purchaseDeclineReasonSchema,
  purchaseKind,
  purchaseReviewFamily,
  referrerId,
  referrerName,
  type Purchase,
} from "../schemas/purchase.schema";
import {
  useApprovePurchase,
  useDeclinePurchase,
} from "../hooks/use-purchase-review";

/* ============================================================
 * Review of one transfer-paid purchase (flex or full-ownership).
 *
 * One dialog, two outcomes. The evidence — bank, reference, receipt — sits
 * above the decision, because that is what the admin is actually judging:
 * "did this money arrive?".
 *
 * Approving is heavy and the copy says so: it creates the payment plan and
 * pays commission in the same motion. Declining an initial purchase releases
 * the units it was holding. FO outright also declines the sibling document tx.
 * ============================================================ */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right font-medium wrap-break-word">
        {value || <span className="font-normal text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

export function ReviewPurchaseDialog({
  row,
  onClose,
}: {
  row: Purchase | null;
  onClose: () => void;
}) {
  const approve = useApprovePurchase();
  const decline = useDeclinePurchase();

  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const pending = approve.isPending || decline.isPending;

  const close = () => {
    setDeclining(false);
    setReason("");
    setReasonError(null);
    onClose();
  };

  if (!row) return null;
  const family = purchaseReviewFamily(row);
  if (!family) return null;

  const details = row.purchase_details;
  const isInitial = isInitialPurchase(row);
  const kind = purchaseKind(row);
  const isFoOutright = kind === "fo_outright_land";
  const isDocPayment = kind === "fo_doc_payment";

  const submitApprove = () => {
    approve.mutate(
      { id: row._id },
      {
        onSuccess: (result) => {
          toast.success(
            isDocPayment
              ? `Approved — document plan updated (${result.planId.slice(-6)})`
              : isInitial
                ? `Approved — payment plan created (${result.planId.slice(-6)}) and commission paid`
                : "Approved — installment recorded and commission paid"
          );
          close();
        },
        onError: (error) => toast.error(error.message || "Couldn't approve"),
      }
    );
  };

  const submitDecline = () => {
    const parsed = purchaseDeclineReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? "Enter a reason");
      return;
    }

    decline.mutate(
      { id: row._id, reason: parsed.data },
      {
        onSuccess: (result) => {
          toast.success(
            result.message ??
              (isInitial ? "Declined — units released" : "Installment declined")
          );
          close();
        },
        onError: (error) => toast.error(error.message || "Couldn't decline"),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review transfer payment</DialogTitle>
          <DialogDescription>
            {isFoOutright
              ? "A full-ownership outright purchase paid by bank transfer. Approving creates the land plan, settles the sibling document fee, and pays commission; declining releases the held units and declines the document row with it."
              : isDocPayment
                ? "A full-ownership document fee paid by bank transfer. Approving records it against the document plan."
                : isInitial
                  ? "A new purchase paid by bank transfer. Approving creates the payment plan and pays commission; declining releases the held units."
                  : "An installment paid by bank transfer. Approving records it against the plan and pays commission."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
            <Row label="Amount" value={<span className="tabular-nums">{formatNaira(row.amount)}</span>} />
            <Row label="Kind" value={kindLabel(details?.transaction_kind)} />
            {details?.size_sqm ? (
              <Row label="Size" value={`${details.size_sqm.toLocaleString()} sqm`} />
            ) : null}
            {details?.tenor_months != null ? (
              <Row
                label="Tenor"
                value={details.tenor_months === 0 ? "Outright" : `${details.tenor_months} months`}
              />
            ) : null}
            <Row
              label="Buyer"
              value={
                <UnresolvedRef name={buyerName(row.user)} id={buyerId(row.user)} kind="buyer" />
              }
            />
            <Row
              label="Asset"
              value={
                <UnresolvedRef
                  name={assetName(row.source_asset)}
                  id={assetId(row.source_asset)}
                  kind="asset"
                />
              }
            />
            {/* Who this approval pays commission to — worth stating before the click. */}
            <Row
              label="Referrer"
              value={
                referrerId(row.user) || referrerName(row.user) ? (
                  <UnresolvedRef
                    name={referrerName(row.user)}
                    id={referrerId(row.user)}
                    kind="referrer"
                  />
                ) : (
                  "No referrer — no commission is paid"
                )
              }
            />
          </div>

          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              The evidence
            </p>
            <Row label="Bank" value={details?.transfer_bank_name} />
            <Row label="Reference" value={details?.transfer_reference_no} />
            <Row
              label="Receipt"
              value={
                details?.transfer_receipt_url ? (
                  <a
                    href={details.transfer_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-4"
                  >
                    Open <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : null
              }
            />
          </div>

          {declining ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Reason — at least {PURCHASE_DECLINE_REASON_MIN} characters, emailed to the buyer
              </p>
              <Textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why this payment can't be confirmed"
                aria-invalid={Boolean(reasonError)}
              />
              {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {declining ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeclining(false)}
                disabled={pending}
              >
                Back
              </Button>
              <Button type="button" variant="destructive" onClick={submitDecline} disabled={pending}>
                {decline.isPending ? (
                  <>
                    Declining <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Confirm decline"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeclining(true)}
                disabled={pending}
              >
                Decline…
              </Button>
              <Button type="button" onClick={submitApprove} disabled={pending}>
                {approve.isPending ? (
                  <>
                    Approving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : isInitial ? (
                  "Approve — create plan & pay commission"
                ) : (
                  "Approve — record payment & pay commission"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
