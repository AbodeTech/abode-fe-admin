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

import {
  formatMeetingWhen,
  MEETING_ACCESS_TYPE_LABELS,
  MEETING_SESSION_KIND_LABELS,
  meetingAudienceDisplay,
  meetingSeriesPositionLabel,
  type Meeting,
  type MeetingAccessType,
  type MeetingSessionKind,
} from "../schemas/meeting.schema";

const HEAD =
  "whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const CELL = "px-4 py-3.5 align-middle";

interface MeetingsTableProps {
  rows?: Meeting[] | null;
  isLoading?: boolean;
}

function kindLabel(kind?: MeetingSessionKind) {
  return kind ? MEETING_SESSION_KIND_LABELS[kind] : "—";
}

function accessLabel(access?: MeetingAccessType) {
  return access ? MEETING_ACCESS_TYPE_LABELS[access] : "—";
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

  const seriesCell = (row: Meeting) => {
    const label = meetingSeriesPositionLabel(row);
    if (row.series_id) {
      return (
        <Link
          href={`/meetings/series/${row.series_id}`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {label}
        </Link>
      );
    }
    return <span className="text-sm text-muted-foreground">{label}</span>;
  };

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
                <AdminMobileField label="Kind" value={kindLabel(row.session_kind)} />
                <AdminMobileField label="Access" value={accessLabel(row.access_type)} />
                <AdminMobileField label="Series" value={meetingSeriesPositionLabel(row)} />
                <AdminMobileField label="Audience" value={meetingAudienceDisplay(row)} />
                <AdminMobileField
                  label="Status"
                  value={
                    row.cancelled_at
                      ? "Cancelled"
                      : row.is_active
                        ? "Active"
                        : "Inactive"
                  }
                />
                <AdminMobileField label="Attendance" value={String(row.verification_count)} />
                {row.series_id ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/meetings/series/${row.series_id}`}>Open series</Link>
                  </Button>
                ) : null}
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
                <TableHead className={HEAD}>Kind</TableHead>
                <TableHead className={HEAD}>Access</TableHead>
                <TableHead className={HEAD}>Series</TableHead>
                <TableHead className={HEAD}>Starts (WAT)</TableHead>
                <TableHead className={HEAD}>Audience</TableHead>
                <TableHead className={HEAD}>Status</TableHead>
                <TableHead className={`${HEAD} text-center`}>Attendance</TableHead>
                <TableHead className={HEAD} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No meetings match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className={`${CELL} font-medium`}>
                      <div className="min-w-0">
                        <p className="truncate">{row.name}</p>
                        {row.series_name ? (
                          <p className="truncate text-xs text-muted-foreground">{row.series_name}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className={CELL}>{kindLabel(row.session_kind)}</TableCell>
                    <TableCell className={CELL}>{accessLabel(row.access_type)}</TableCell>
                    <TableCell className={CELL}>{seriesCell(row)}</TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap`}>
                      {formatMeetingWhen(row.starts_at)}
                    </TableCell>
                    <TableCell className={`${CELL} max-w-[14rem] truncate`}>
                      {meetingAudienceDisplay(row)}
                    </TableCell>
                    <TableCell className={CELL}>
                      <Badge
                        className={
                          row.cancelled_at
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : row.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {row.cancelled_at
                          ? "Cancelled"
                          : row.is_active
                            ? "Active"
                            : "Inactive"}
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
