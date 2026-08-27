"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Mail, Wrench } from "lucide-react";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import type { PurchaseConfirmationRow } from "../hooks/use-purchase-confirmations";
import { ConfirmationStatusBadge, daysWaitingLabel } from "./ConfirmationStatusBadge";

// Kept on the typed-row approach (no fragment colocation): the BE row is
// nested (buyer/snapshot/disputes) with derived fields (reminders count,
// dispute dates), and the same flat row is shared by the page and modals —
// the hook flattens it once in `select`.

const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const productLabel = (product: PurchaseConfirmationRow["product"]) =>
  product === "full-ownership" ? "Full ownership" : "Flex";

interface PurchaseConfirmationsTableProps {
  rows?: PurchaseConfirmationRow[] | null;
  isLoading?: boolean;
  onView: (row: PurchaseConfirmationRow) => void;
  onResolve: (row: PurchaseConfirmationRow) => void;
  onResendEmail: (row: PurchaseConfirmationRow) => void;
}

export function PurchaseConfirmationsTable({
  rows,
  isLoading,
  onView,
  onResolve,
  onResendEmail,
}: PurchaseConfirmationsTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRows = rows ?? [];

  const rowActions = (row: PurchaseConfirmationRow, mobile = false) => (
    <div className={mobile ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
      <Button
        variant="outline"
        size="sm"
        className={mobile ? "w-full gap-2" : "gap-2"}
        onClick={() => onView(row)}
      >
        <Eye className="h-4 w-4" />
        View
      </Button>
      {row.status === "disputed" && (
        <Button
          size="sm"
          className={mobile ? "w-full gap-2" : "gap-2"}
          onClick={() => onResolve(row)}
        >
          <Wrench className="h-4 w-4" />
          Resolve
        </Button>
      )}
      {row.status === "waiting" && (
        <Button
          variant="outline"
          size="sm"
          className={mobile ? "w-full gap-2" : "gap-2"}
          onClick={() => onResendEmail(row)}
        >
          <Mail className="h-4 w-4" />
          Resend email
        </Button>
      )}
    </div>
  );

  const statusCell = (row: PurchaseConfirmationRow) => (
    <div className="flex flex-col items-start gap-1">
      <ConfirmationStatusBadge status={row.status} />
      {row.status === "waiting" && (
        <span className="text-xs text-muted-foreground">
          {daysWaitingLabel(row.emailSentAt) ?? "email not sent"}
        </span>
      )}
      {row.status === "confirmed" && (
        <span className="text-xs text-muted-foreground">{formatDate(row.confirmedAt)}</span>
      )}
      {row.status === "disputed" && (
        <span className="text-xs text-muted-foreground">{formatDate(row.disputedAt)}</span>
      )}
    </div>
  );

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No purchases match these filters.
            </p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard key={row.id} title={row.buyerName} subtitle={row.buyerEmail}>
                <AdminMobileField label="Referred by" value={row.referrerName ?? "No referrer"} />
                <AdminMobileField
                  label="Asset"
                  value={`${row.assetName} (${productLabel(row.product)})`}
                />
                <AdminMobileField label="Name on document" value={row.nameOnDocument} />
                <AdminMobileField label="Total" value={formatAmount(row.totalPayable)} />
                <AdminMobileField label="Purchased" value={formatDate(row.purchasedAt)} />
                <AdminMobileField label="Status" value={statusCell(row)} />
                <div className="border-t border-border pt-2">{rowActions(row, true)}</div>
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-max min-w-[1360px] table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-48 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Buyer
                </TableHead>
                <TableHead className="min-w-36 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Referred By
                </TableHead>
                <TableHead className="min-w-48 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Asset
                </TableHead>
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Name On Document
                </TableHead>
                <TableHead className="min-w-32 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </TableHead>
                <TableHead className="min-w-28 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Purchased
                </TableHead>
                <TableHead className="min-w-32 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No purchases match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">{row.buyerName}</span>
                      <span className="block wrap-break-word text-xs text-muted-foreground">
                        {row.buyerEmail}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {row.referrerName ?? (
                        <span className="text-muted-foreground">No referrer</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word">{row.assetName}</span>
                      <Badge variant="outline" className="mt-1 font-normal">
                        {productLabel(row.product)}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {row.nameOnDocument}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 tabular-nums leading-relaxed">
                      {formatAmount(row.totalPayable)}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 leading-relaxed">
                      {formatDate(row.purchasedAt)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      {statusCell(row)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                      {rowActions(row)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  );
}
