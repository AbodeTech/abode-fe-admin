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

import {
  PAYMENT_PROVIDER_LABELS,
  withdrawalActions,
  type Withdrawal,
} from "../schemas/withdrawal.schema";
import { MoneyState, WithdrawalStatusBadge } from "./WithdrawalStatusBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
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
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested by</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  {/*
                    ⛔ ticket 13 — a bare ObjectId. The queue's central column
                    is an em-dash until the backend populates the user.
                  */}
                  <UnresolvedRef name={null} id={row.user} kind="requester" />
                </TableCell>
                <TableCell>
                  <Amount row={row} />
                </TableCell>
                <TableCell>
                  <Provider row={row} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.createdAt)}
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
              <AdminMobileField
                label="Requested by"
                value={<UnresolvedRef name={null} id={row.user} kind="requester" />}
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
