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
  assetId,
  assetLocation,
  assetName,
  buyerEmail,
  buyerId,
  buyerName,
  isReviewablePurchase,
  kindLabel,
  referrerId,
  referrerName,
  type Purchase,
} from "../schemas/purchase.schema";
import { PurchaseStatusBadge, ReviewHint } from "./PurchaseStatusBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function userHref(id: string | null): string | null {
  return id ? `/users/${id}` : null;
}

/** The payer, linked through to their account. */
function Buyer({ row }: { row: Purchase }) {
  const id = buyerId(row.user);
  const email = buyerEmail(row.user);

  return (
    <div className="min-w-0 space-y-0.5">
      <UnresolvedRef name={buyerName(row.user)} id={id} href={userHref(id)} kind="buyer" />
      {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
    </div>
  );
}

/**
 * The buyer's referrer (ticket 24b) — approving this purchase pays them
 * commission, so who they are belongs on the row being approved.
 *
 * A buyer with no referrer says so rather than showing an em-dash: "nobody is
 * owed commission here" is information, and it is different from "we can't tell
 * you who".
 */
function Referrer({ row }: { row: Purchase }) {
  const id = referrerId(row.user);
  const name = referrerName(row.user);

  if (!id && !name) {
    return <span className="text-sm text-muted-foreground">No referrer</span>;
  }

  return <UnresolvedRef name={name} id={id} href={userHref(id)} kind="referrer" />;
}

/**
 * The property, with its location beneath.
 *
 * Deliberately not built from `description` the way the screen this replaces
 * was: in v2 that field is one of four fixed literals with no property in it
 * (⛔ ticket 24c), so `source_asset` is the only honest source for this column.
 */
function Property({ row }: { row: Purchase }) {
  const name = assetName(row.source_asset);
  const location = assetLocation(row.source_asset);
  const details = row.purchase_details;
  const size = details?.size_sqm ? `${details.size_sqm.toLocaleString()} sqm` : null;

  return (
    <div className="min-w-0 space-y-0.5">
      <UnresolvedRef name={name} id={assetId(row.source_asset)} kind="asset" />
      {location || size ? (
        <p className="truncate text-xs text-muted-foreground">
          {[location, size].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
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
      {/*
        Column order follows the screen this replaces: payer, referrer, property,
        kind, amount, method, date, status, action. Production's Property Owner
        column is absent — v2 has no field for it and no known equivalent
        (⛔ ticket 24b), and inventing one would be worse than leaving it out.
      */}
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Property</TableHead>
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
                <TableCell className="max-w-[14rem]">
                  <Buyer row={row} />
                </TableCell>
                <TableCell className="max-w-[12rem] text-sm">
                  <Referrer row={row} />
                </TableCell>
                <TableCell className="max-w-[14rem]">
                  <Property row={row} />
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
            <AdminMobileField label="Buyer" value={<Buyer row={row} />} />
            <AdminMobileField label="Referrer" value={<Referrer row={row} />} />
            <AdminMobileField label="Property" value={<Property row={row} />} />
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
