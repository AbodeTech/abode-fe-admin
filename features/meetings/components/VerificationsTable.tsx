"use client";

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

import {
  formatMeetingWhen,
  verificationDisplayName,
  type MeetingVerification,
} from "../schemas/meeting.schema";

const HEAD =
  "whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

interface VerificationsTableProps {
  rows?: MeetingVerification[] | null;
  isLoading?: boolean;
}

export function VerificationsTable({ rows, isLoading }: VerificationsTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRows = rows ?? [];

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No verifications yet.
            </p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard key={row.id} title={verificationDisplayName(row)} subtitle={row.email}>
                <AdminMobileField label="Status" value={row.referral_status ?? "—"} />
                <AdminMobileField label="Verified" value={formatMeetingWhen(row.verified_at)} />
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD}>Name</TableHead>
                <TableHead className={HEAD}>Email</TableHead>
                <TableHead className={HEAD}>Referral status</TableHead>
                <TableHead className={HEAD}>Phone</TableHead>
                <TableHead className={HEAD}>Verified (WAT)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No verifications yet.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{verificationDisplayName(row)}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.referral_status ?? "—"}</TableCell>
                    <TableCell>{row.phone ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatMeetingWhen(row.verified_at)}
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
