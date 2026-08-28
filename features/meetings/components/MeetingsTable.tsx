"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

import { DEFAULT_DURATION_MINUTES, formatMeetingWhen, type Meeting } from "../schemas/meeting.schema";

const HEAD =
  "whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const CELL = "px-4 py-3.5 align-middle";

interface MeetingsTableProps {
  rows?: Meeting[] | null;
  isLoading?: boolean;
}

export function MeetingsTable({ rows, isLoading }: MeetingsTableProps) {
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

  const viewButton = (row: Meeting, mobile = false) => (
    <Button variant="outline" size="sm" className={mobile ? "w-full gap-2" : "gap-2"} asChild>
      <Link href={`/meetings/${row.id}`}>
        <Eye className="h-4 w-4" aria-hidden />
        View
      </Link>
    </Button>
  );

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No meetings match these filters.
            </p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard
                key={row.id}
                title={row.name}
                subtitle={formatMeetingWhen(row.starts_at)}
              >
                <AdminMobileField
                  label="Duration"
                  value={`${row.duration_minutes ?? DEFAULT_DURATION_MINUTES} min`}
                />
                <AdminMobileField label="Audience" value={row.audience_label} />
                <AdminMobileField
                  label="Status"
                  value={row.is_active ? "Active" : "Inactive"}
                />
                <AdminMobileField label="Verified" value={String(row.verification_count)} />
                {viewButton(row, true)}
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD}>Name</TableHead>
                <TableHead className={HEAD}>Starts (WAT)</TableHead>
                <TableHead className={HEAD}>Duration</TableHead>
                <TableHead className={HEAD}>Audience</TableHead>
                <TableHead className={HEAD}>Status</TableHead>
                <TableHead className={`${HEAD} text-center`}>Verified</TableHead>
                <TableHead className={HEAD} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No meetings match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className={`${CELL} font-medium`}>{row.name}</TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap`}>
                      {formatMeetingWhen(row.starts_at)}
                    </TableCell>
                    <TableCell className={`${CELL} tabular-nums`}>
                      {row.duration_minutes ?? DEFAULT_DURATION_MINUTES} min
                    </TableCell>
                    <TableCell className={CELL}>{row.audience_label}</TableCell>
                    <TableCell className={CELL}>
                      <Badge
                        className={
                          row.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`${CELL} text-center tabular-nums`}>
                      {row.verification_count}
                    </TableCell>
                    <TableCell className={`${CELL} text-right`}>{viewButton(row)}</TableCell>
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
