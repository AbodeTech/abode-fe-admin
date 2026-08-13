"use client";

import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { cn } from "@/lib/utils";

import {
  KYC_STATE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  bankAccountName,
  bankAccountNumber,
  bankDetailsId,
  bankName,
  personEmail,
  personId,
  personName,
  personTin,
  withdrawalActions,
  type Withdrawal,
} from "../schemas/withdrawal.schema";
import { ProcessingMethodBadge } from "./ProcessingMethodBadge";
import { MoneyState, WithdrawalStatusBadge } from "./WithdrawalStatusBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Who is requesting — name when populated, em-dash + id otherwise, linked
 * through to their profile. An admin about to release money reaches for the
 * account behind it constantly.
 */
function Requester({ row }: { row: Withdrawal }) {
  const email = personEmail(row.user);
  const id = personId(row.user);
  return (
    <div className="min-w-0 space-y-0.5">
      <UnresolvedRef
        name={personName(row.user)}
        id={id}
        href={id ? `/users/${id}` : null}
        kind="requester"
      />
      {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
    </div>
  );
}

/**
 * The requester's tax ID (ticket 23).
 *
 * An unverified TIN renders muted with its state, because this screen releases
 * money and a number nobody has checked must not read the same as one that has
 * been. Only `approved` gets the plain treatment.
 */
function Tin({ row }: { row: Withdrawal }) {
  const tin = personTin(row.user);

  if (!tin?.value) {
    return (
      <span className="text-sm text-muted-foreground" aria-label="No TIN on file">
        —
      </span>
    );
  }

  const verified = tin.state === "approved";

  return (
    <div className="min-w-0 space-y-0.5">
      <p className={cn("font-mono text-sm tabular-nums", !verified && "text-muted-foreground")}>
        {tin.value}
      </p>
      {!verified ? (
        <p className="text-xs text-amber-700">
          {tin.state ? KYC_STATE_LABELS[tin.state] : "Unverified"}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One field of the destination account. Rendered as three separate columns as
 * the production screen does, because an admin scanning the queue is comparing
 * account numbers down a column — not reading a combined label per row.
 *
 * Falls back to the em-dash + copyable-id pattern when the whole ref is a bare
 * id, so the destination is never silently blank.
 */
function BankField({
  row,
  value,
  mono,
}: {
  row: Withdrawal;
  value: string | null;
  mono?: boolean;
}) {
  if (value) {
    return <span className={mono ? "font-mono text-sm tabular-nums" : "text-sm"}>{value}</span>;
  }
  return (
    <UnresolvedRef name={null} id={bankDetailsId(row.bank_details_id)} kind="bank account" />
  );
}

/**
 * The requested amount, with what actually leaves the wallet beneath when a
 * fee makes them differ.
 */
function Amount({ row }: { row: Withdrawal }) {
  const total = row.total_debited;
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium tabular-nums">{formatNaira(row.amount)}</p>
      {typeof total === "number" && total !== row.amount ? (
        <p className="text-xs text-muted-foreground tabular-nums">{formatNaira(total)} debited</p>
      ) : null}
    </div>
  );
}

/** The rail, plus the last refusal when the transfer has bounced. */
function Provider({ row }: { row: Withdrawal }) {
  const lastAttempt = row.rail_attempts[row.rail_attempts.length - 1];
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm">
        {row.payment_provider ? PAYMENT_PROVIDER_LABELS[row.payment_provider] : "—"}
      </p>
      {lastAttempt ? (
        <p className="max-w-56 truncate text-xs text-muted-foreground" title={lastAttempt.error.message}>
          {lastAttempt.error.message}
        </p>
      ) : null}
    </div>
  );
}

function RowActions({
  row,
  onApprove,
  onDecline,
  onRetry,
}: {
  row: Withdrawal;
  onApprove: (row: Withdrawal) => void;
  onDecline: (row: Withdrawal) => void;
  onRetry: (row: Withdrawal) => void;
}) {
  const actions = withdrawalActions(row);
  if (!actions.canApprove && !actions.canDecline && !actions.canRetry) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Withdrawal actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.canApprove ? (
          <DropdownMenuItem onClick={() => onApprove(row)}>Approve</DropdownMenuItem>
        ) : null}
        {actions.canRetry ? (
          <DropdownMenuItem onClick={() => onRetry(row)}>Retry transfer</DropdownMenuItem>
        ) : null}
        {actions.canDecline ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDecline(row)}>
            Decline
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface Props {
  rows: Withdrawal[];
  isLoading: boolean;
  onApprove: (row: Withdrawal) => void;
  onDecline: (row: Withdrawal) => void;
  onRetry: (row: Withdrawal) => void;
  emptyState: React.ReactNode;
}

export function WithdrawalsTable({
  rows,
  isLoading,
  onApprove,
  onDecline,
  onRetry,
  emptyState,
}: Props) {
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
        Column order follows the production screen: payer, then the destination
        account in three columns, amount, date, how it was processed, status,
        action.

        Two differences. **TIN is absent** — in v2 it moved onto the KYC
        subdocument and isn't reachable from this endpoint (⛔ ticket 23); when it
        lands it slots in directly after Requested by. And **Provider** is new —
        v2 can route a payout through Paystack or Paga and record the rail's
        refusal, which production had no concept of; it sits beside Method, the
        other "how did this get paid" column.
      */}
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested by</TableHead>
              <TableHead>TIN</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account number</TableHead>
              <TableHead>Account name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell className="max-w-[14rem]">
                  <Requester row={row} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Tin row={row} />
                </TableCell>
                <TableCell className="max-w-[10rem]">
                  <BankField row={row} value={bankName(row.bank_details_id)} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <BankField row={row} value={bankAccountNumber(row.bank_details_id)} mono />
                </TableCell>
                <TableCell className="max-w-[12rem]">
                  <BankField row={row} value={bankAccountName(row.bank_details_id)} />
                </TableCell>
                <TableCell>
                  <Amount row={row} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell>
                  <ProcessingMethodBadge type={row.processing_type} />
                </TableCell>
                <TableCell>
                  <Provider row={row} />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <WithdrawalStatusBadge status={row.admin_status ?? "pending"} />
                    <MoneyState status={row.status} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <RowActions
                    row={row}
                    onApprove={onApprove}
                    onDecline={onDecline}
                    onRetry={onRetry}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((row) => {
          const actions = withdrawalActions(row);
          return (
            <AdminMobileCard
              key={row._id}
              title={
                <span className="flex flex-wrap items-center justify-between gap-2">
                  {formatNaira(row.amount)}
                  <WithdrawalStatusBadge status={row.admin_status ?? "pending"} />
                </span>
              }
              subtitle={formatDate(row.createdAt)}
            >
              <AdminMobileField label="Requested by" value={<Requester row={row} />} />
              <AdminMobileField label="TIN" value={<Tin row={row} />} />
              <AdminMobileField
                label="Bank"
                value={<BankField row={row} value={bankName(row.bank_details_id)} />}
              />
              <AdminMobileField
                label="Account number"
                value={<BankField row={row} value={bankAccountNumber(row.bank_details_id)} mono />}
              />
              <AdminMobileField
                label="Account name"
                value={<BankField row={row} value={bankAccountName(row.bank_details_id)} />}
              />
              <AdminMobileField
                label="Method"
                value={<ProcessingMethodBadge type={row.processing_type} />}
              />
              <AdminMobileField
                label="Provider"
                value={
                  row.payment_provider ? PAYMENT_PROVIDER_LABELS[row.payment_provider] : "—"
                }
              />
              {typeof row.total_debited === "number" && row.total_debited !== row.amount ? (
                <AdminMobileField label="Debited" value={formatNaira(row.total_debited)} />
              ) : null}
              {row.rail_attempts.length > 0 ? (
                <AdminMobileField
                  label="Last error"
                  value={row.rail_attempts[row.rail_attempts.length - 1].error.message}
                />
              ) : null}
              {actions.canApprove || actions.canDecline || actions.canRetry ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {actions.canApprove ? (
                    <Button size="sm" onClick={() => onApprove(row)}>
                      Approve
                    </Button>
                  ) : null}
                  {actions.canRetry ? (
                    <Button size="sm" variant="outline" onClick={() => onRetry(row)}>
                      Retry
                    </Button>
                  ) : null}
                  {actions.canDecline ? (
                    <Button size="sm" variant="outline" onClick={() => onDecline(row)}>
                      Decline
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </AdminMobileCard>
          );
        })}
      </AdminMobileStack>
    </>
  );
}
