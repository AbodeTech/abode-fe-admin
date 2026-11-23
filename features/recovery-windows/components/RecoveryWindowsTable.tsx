"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import type { RecoveryRow } from "../schemas/recovery-window.schema";
import { DaysLeft, RecoveryStageBadge } from "./RecoveryStageBadge";
import { dateTime, longDate, naira, nextStepLine, productLabel, reminderLabel } from "./format";

const PRE_END = ["open", "choice_sent", "terms_sent", "payment_pending"];

const head =
  "whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

interface Props {
  rows: RecoveryRow[];
  isLoading?: boolean;
  recordHref: (row: RecoveryRow) => string;
  onRemind: (row: RecoveryRow) => void;
  remindingId?: string | null;
  canRemind: boolean;
}

/**
 * The whole row opens the record. The only action here is Send reminder;
 * everything else (terms, refunds) happens on the record.
 */
export function RecoveryWindowsTable({ rows, isLoading, recordHref, onRemind, remindingId, canRemind }: Props) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const remind = (row: RecoveryRow) =>
    canRemind && row.can_remind ? (
      <div className="flex flex-col items-start gap-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={remindingId === row.id}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemind(row);
          }}
        >
          <Bell className="h-4 w-4" />
          Send reminder
        </Button>
        <span className="text-xs text-muted-foreground">
          {row.last_reminder
            ? `Last: ${dateTime(row.last_reminder.sent_at)} (${reminderLabel(row.last_reminder.kind)})`
            : "No reminder sent yet"}
        </span>
      </div>
    ) : null;

  if (rows.length === 0) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nothing on this tab.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {rows.map((row) => (
            <Link key={row.id} href={recordHref(row)} className="block">
              <AdminMobileCard
                title={row.customer_name ?? "Unknown customer"}
                subtitle={<RecoveryStageBadge stage={row.stage} />}
              >
                <AdminMobileField
                  label="Plan"
                  value={`${row.asset_name ?? "—"}${row.size_sqm ? ` · ${row.size_sqm} sqm` : ""}`}
                />
                <AdminMobileField label="Paid" value={`${naira(row.land_paid)} · ${Math.round(row.share_paid_pct)}%`} />
                <AdminMobileField label="Window ends" value={longDate(row.window_ends_at)} />
                <p className="text-sm text-muted-foreground">{nextStepLine(row)}</p>
                {remind(row)}
              </AdminMobileCard>
            </Link>
          ))}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-full min-w-[1240px] table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`min-w-44 ${head}`}>Customer</TableHead>
                <TableHead className={`min-w-44 ${head}`}>Plan</TableHead>
                <TableHead className={`min-w-32 ${head}`}>Paid so far</TableHead>
                <TableHead className={`min-w-28 ${head}`}>Default fee owed</TableHead>
                <TableHead className={`min-w-28 ${head}`}>Suspended</TableHead>
                <TableHead className={`min-w-28 ${head}`}>Window ends</TableHead>
                <TableHead className={`min-w-28 ${head}`}>Days left</TableHead>
                <TableHead className={`min-w-44 ${head}`}>Stage</TableHead>
                <TableHead className={`min-w-72 ${head}`}>Next step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const href = recordHref(row);
                const cell = "block px-4 py-3.5";
                return (
                  <TableRow key={row.id} className="cursor-pointer align-top hover:bg-muted/40">
                    <TableCell className="p-0">
                      <Link href={href} className={cell}>
                        <span className="block font-semibold">{row.customer_name ?? "Unknown customer"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {row.customer_phone ?? row.customer_email ?? ""}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link href={href} className={cell} tabIndex={-1}>
                        <span className="block">
                          {row.asset_name ?? "—"}
                          {row.size_sqm ? ` · ${row.size_sqm} sqm` : ""}
                        </span>
                        <span className="block text-xs text-muted-foreground">{productLabel(row.plan_type)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="p-0 tabular-nums">
                      <Link href={href} className={cell} tabIndex={-1}>
                        <span className="block font-semibold">{naira(row.land_paid)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {Math.round(row.share_paid_pct)}% of land
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="p-0 tabular-nums">
                      <Link href={href} className={cell} tabIndex={-1}>
                        {row.plan_type === "flex" ? "— (Flex)" : naira(row.default_fee_owed)}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0 tabular-nums">
                      <Link href={href} className={cell} tabIndex={-1}>
                        {longDate(row.suspended_at)}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0 tabular-nums">
                      <Link href={href} className={cell} tabIndex={-1}>
                        {longDate(row.window_ends_at)}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link href={href} className={cell} tabIndex={-1}>
                        <DaysLeft days={row.days_left} ended={!PRE_END.includes(row.stage)} />
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link href={href} className={cell} tabIndex={-1}>
                        <RecoveryStageBadge stage={row.stage} />
                      </Link>
                    </TableCell>
                    <TableCell className="space-y-2 px-4 py-3.5 whitespace-normal">
                      <Link href={href} className="block leading-snug" tabIndex={-1}>
                        {nextStepLine(row)}
                      </Link>
                      {remind(row)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  );
}
