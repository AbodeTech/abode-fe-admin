"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Mail, Wrench } from "lucide-react";

import type { PurchaseConfirmationRow } from "../hooks/use-purchase-confirmations";
import { ConfirmationStatusBadge } from "./ConfirmationStatusBadge";

const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium wrap-break-word">{value}</span>
    </div>
  );
}

interface PurchaseConfirmationDetailModalProps {
  open: boolean;
  row?: PurchaseConfirmationRow | null;
  onOpenChange: (open: boolean) => void;
  onResolve: (row: PurchaseConfirmationRow) => void;
  onResendEmail: (row: PurchaseConfirmationRow) => void;
}

export function PurchaseConfirmationDetailModal({
  open,
  row,
  onOpenChange,
  onResolve,
  onResendEmail,
}: PurchaseConfirmationDetailModalProps) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Purchase confirmation
            <ConfirmationStatusBadge status={row.status} />
          </DialogTitle>
          <DialogDescription>
            {row.buyerName} · {row.assetName}
          </DialogDescription>
        </DialogHeader>

        {row.status === "disputed" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Buyer reported a problem
              {row.disputedAt ? ` · ${formatDateTime(row.disputedAt)}` : ""}
            </p>
            <p className="mt-1.5 text-sm text-red-800">
              {row.disputeNote?.trim() || "No note was added."}
            </p>
          </div>
        )}

        <div className="space-y-0.5">
          <DetailRow label="Buyer" value={row.buyerName} />
          <DetailRow label="Email" value={row.buyerEmail} />
          <DetailRow label="Referred by" value={row.referrerName ?? "No referrer"} />
          <Separator className="my-2" />
          <DetailRow label="Asset" value={row.assetName} />
          <DetailRow
            label="Product"
            value={row.product === "full-ownership" ? "Full ownership" : "Flex"}
          />
          <DetailRow label="Name on document" value={row.nameOnDocument} />
          <DetailRow label="Size" value={`${row.sizeSqm} sqm`} />
          <DetailRow label="Units" value={row.units} />
          <DetailRow label="Payment plan" value={row.planLabel} />
          <DetailRow label="Total payable" value={formatAmount(row.totalPayable)} />
          <DetailRow label="Reference" value={row.uniqueAssetId} />
          <Separator className="my-2" />
          <DetailRow label="Purchased" value={formatDateTime(row.purchasedAt)} />
          <DetailRow label="Confirmation email sent" value={formatDateTime(row.emailSentAt)} />
          <DetailRow label="Reminders sent" value={row.remindersSent} />
          {row.confirmedAt && (
            <DetailRow label="Confirmed" value={formatDateTime(row.confirmedAt)} />
          )}
          {row.resolvedAt && (
            <DetailRow label="Dispute resolved" value={formatDateTime(row.resolvedAt)} />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {row.status === "waiting" && (
            <Button variant="outline" className="gap-2" onClick={() => onResendEmail(row)}>
              <Mail className="h-4 w-4" />
              Resend email
            </Button>
          )}
          {row.status === "disputed" && (
            <Button className="gap-2" onClick={() => onResolve(row)}>
              <Wrench className="h-4 w-4" />
              Resolve dispute
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
