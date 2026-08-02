"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { formatNaira } from "@/lib/utils/format";

import {
  PAYMENT_METHOD_LABELS,
  isReviewablePurchase,
  kindLabel,
  type Purchase,
} from "../schemas/purchase.schema";
import { PurchaseStatusBadge, ReviewHint } from "./PurchaseStatusBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/** Amount, with the deal size beneath when the details carry it. */
function AmountCell({ row }: { row: Purchase }) {
  const details = row.purchase_details;
  const sub = [
    details?.size_sqm ? `${details.size_sqm.toLocaleString()} sqm` : null,
    details?.no_of_units ? `${details.no_of_units} unit(s)` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium tabular-nums">{formatNaira(row.amount)}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

interface Props {
  rows: Purchase[];
  isLoading: boolean;
  onReview: (row: Purchase) => void;
  emptyState: React.ReactNode;
}

export function PurchasesTable({ rows, isLoading, onReview, emptyState }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <>{emptyState}</>;

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  {/* ⛔ ticket 13 — bare ObjectIds until the endpoint populates. */}
                  <UnresolvedRef name={null} id={row.user} kind="buyer" />
                </TableCell>
                <TableCell>
                  <UnresolvedRef name={null} id={row.source_asset} kind="asset" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {kindLabel(row.purchase_details?.transaction_kind)}
                </TableCell>
                <TableCell>
                  <AmountCell row={row} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[row.payment_method]}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <PurchaseStatusBadge status={row.status} />
                    <ReviewHint row={row} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {isReviewablePurchase(row) ? (
                    <Button size="sm" variant="outline" onClick={() => onReview(row)}>
                      Review
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((row) => (
          <AdminMobileCard
            key={row._id}
            title={
              <span className="flex flex-wrap items-center justify-between gap-2">
                {formatNaira(row.amount)}
                <PurchaseStatusBadge status={row.status} />
              </span>
            }
            subtitle={`${kindLabel(row.purchase_details?.transaction_kind)} · ${formatDate(row.createdAt)}`}
          >
            <AdminMobileField
              label="Buyer"
              value={<UnresolvedRef name={null} id={row.user} kind="buyer" />}
            />
            <AdminMobileField
              label="Asset"
              value={<UnresolvedRef name={null} id={row.source_asset} kind="asset" />}
            />
            <AdminMobileField label="Method" value={PAYMENT_METHOD_LABELS[row.payment_method]} />
            {isReviewablePurchase(row) ? (
              <div className="mt-2">
                <Button size="sm" onClick={() => onReview(row)}>
                  Review
                </Button>
              </div>
            ) : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
