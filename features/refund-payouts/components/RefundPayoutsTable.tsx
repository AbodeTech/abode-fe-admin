"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { formatNaira } from "@/lib/utils/format";

import { refundPayoutActions, type RefundPayout } from "../schemas/refund-payout.schema";
import { RefundPayoutStatusBadge } from "./RefundPayoutStatusBadge";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function Customer({ row }: { row: RefundPayout }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <Link href={`/users/${row.user_id}`} className="text-sm font-medium hover:underline">
        {row.customer_name ?? "Unknown customer"}
      </Link>
      {row.customer_email ? <p className="truncate text-xs text-muted-foreground">{row.customer_email}</p> : null}
    </div>
  );
}

/** The plan the refund is for, linked to its recovery record. */
function Plan({ row }: { row: RefundPayout }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <Link href={`/recovery-period/${row.recovery_window_id}`} className="text-sm hover:underline">
        {row.asset_name ?? "Plan"}
        {row.size_sqm ? ` · ${row.size_sqm} sqm` : ""}
      </Link>
      <p className="text-xs text-muted-foreground">{row.ended_early ? "Ended early by the customer" : "Window ran out"}</p>
    </div>
  );
}

function Bank({ row, field, mono }: { row: RefundPayout; field: "bank_name" | "account_number" | "account_name"; mono?: boolean }) {
  if (!row.bank) {
    return field === "bank_name" ? (
      <span className="text-xs text-amber-700">No bank account saved</span>
    ) : (
      <span className="text-sm text-muted-foreground">—</span>
    );
  }
  return <span className={mono ? "font-mono text-sm tabular-nums" : "text-sm"}>{row.bank[field]}</span>;
}

/** Status, plus the reference or the last error beneath it. */
function Status({ row }: { row: RefundPayout }) {
  const sub =
    row.status === "retry_needed"
      ? row.last_error
      : row.status === "paid"
        ? row.method === "manual"
          ? `By hand · ${row.manual_reference ?? ""}`
          : `Paystack · ${formatDate(row.paid_at)}`
        : row.status === "processing"
          ? `Sent ${formatDate(row.sent_at)}`
          : null;
  return (
    <div className="space-y-1">
      <RefundPayoutStatusBadge status={row.status} />
      {sub ? (
        <p className="max-w-56 truncate text-xs text-muted-foreground" title={sub}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

interface Handlers {
  onSend: (row: RefundPayout) => void;
  onMarkPaid: (row: RefundPayout) => void;
}

function RowActions({ row, onSend, onMarkPaid }: { row: RefundPayout } & Handlers) {
  const a = refundPayoutActions(row);
  if (!a.canSend && !a.canRetry && !a.canMarkPaid) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Refund actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {a.canSend ? <DropdownMenuItem onClick={() => onSend(row)}>Send to bank</DropdownMenuItem> : null}
        {a.canRetry ? <DropdownMenuItem onClick={() => onSend(row)}>Retry transfer</DropdownMenuItem> : null}
        {a.canMarkPaid ? (
          <DropdownMenuItem onClick={() => onMarkPaid(row)}>Mark paid by hand</DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface Props extends Handlers {
  rows: RefundPayout[];
  isLoading: boolean;
  emptyState: React.ReactNode;
}

/** Same column order as Withdrawals: who, the account in three columns, amount, date, status. */
export function RefundPayoutsTable({ rows, isLoading, emptyState, onSend, onMarkPaid }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
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
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account number</TableHead>
              <TableHead>Account name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-[14rem] whitespace-normal wrap-break-word">
                  <Customer row={row} />
                </TableCell>
                <TableCell className="max-w-[14rem] whitespace-normal wrap-break-word">
                  <Plan row={row} />
                </TableCell>
                <TableCell className="min-w-[8rem] max-w-[10rem] whitespace-normal wrap-break-word">
                  <Bank row={row} field="bank_name" />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Bank row={row} field="account_number" mono />
                </TableCell>
                <TableCell className="min-w-[9rem] max-w-[12rem] whitespace-normal wrap-break-word">
                  <Bank row={row} field="account_name" />
                </TableCell>
                <TableCell className="text-sm font-medium tabular-nums">{formatNaira(row.amount)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.approved_at)}
                </TableCell>
                <TableCell>
                  <Status row={row} />
                </TableCell>
                <TableCell className="text-right">
                  <RowActions row={row} onSend={onSend} onMarkPaid={onMarkPaid} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((row) => {
          const a = refundPayoutActions(row);
          return (
            <AdminMobileCard
              key={row.id}
              title={
                <span className="flex flex-wrap items-center justify-between gap-2">
                  {formatNaira(row.amount)}
                  <RefundPayoutStatusBadge status={row.status} />
                </span>
              }
              subtitle={`Approved ${formatDate(row.approved_at)}`}
            >
              <AdminMobileField label="Customer" value={<Customer row={row} />} />
              <AdminMobileField label="Plan" value={<Plan row={row} />} />
              <AdminMobileField label="Bank" value={<Bank row={row} field="bank_name" />} />
              <AdminMobileField label="Account number" value={<Bank row={row} field="account_number" mono />} />
              <AdminMobileField label="Account name" value={<Bank row={row} field="account_name" />} />
              {row.last_error && row.status === "retry_needed" ? (
                <AdminMobileField label="Last error" value={row.last_error} />
              ) : null}
              {a.canSend || a.canRetry || a.canMarkPaid ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.canSend || a.canRetry ? (
                    <Button size="sm" onClick={() => onSend(row)}>
                      {a.canRetry ? "Retry" : "Send to bank"}
                    </Button>
                  ) : null}
                  {a.canMarkPaid ? (
                    <Button size="sm" variant="outline" onClick={() => onMarkPaid(row)}>
                      Mark paid
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
