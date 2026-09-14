"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, Eye } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
import { useHasPermission } from "@/hooks/use-admin-permission";

import {
  useCancelMeetingSeries,
  useCancelMeetingSession,
  useMeetingSeries,
} from "../hooks/use-meetings";
import {
  formatMeetingWhen,
  MEETING_ACCESS_TYPE_LABELS,
  type Meeting,
} from "../schemas/meeting.schema";

const HEAD =
  "whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const CELL = "px-4 py-3.5 align-middle";

function sessionStatus(session: Meeting) {
  if (session.cancelled_at) return "Cancelled";
  if (new Date(session.ends_at ?? session.starts_at).getTime() < Date.now()) return "Completed";
  if (!session.is_active) return "Inactive";
  return "Upcoming";
}

function statusBadgeClass(status: string) {
  if (status === "Cancelled") return "bg-red-100 text-red-800 hover:bg-red-100";
  if (status === "Completed") return "bg-slate-100 text-slate-800 hover:bg-slate-100";
  if (status === "Upcoming") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  return "bg-gray-100 text-gray-800 hover:bg-gray-100";
}

export function SeriesDetailPage() {
  const params = useParams<{ seriesId: string }>();
  const seriesId = params.seriesId;
  const canManage = useHasPermission("manage_meetings");
  const seriesQuery = useMeetingSeries(seriesId);
  const cancelSeries = useCancelMeetingSeries();
  const cancelSession = useCancelMeetingSession();

  const series = seriesQuery.data;

  const [cancelSeriesOpen, setCancelSeriesOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);

  const copyShareUrl = async () => {
    if (!series?.share_url) return;
    try {
      await navigator.clipboard.writeText(series.share_url);
      toast.success("Series link copied");
    } catch {
      toast.error("Could not copy series link");
    }
  };

  const handleCancelSeries = async () => {
    if (!series) return;
    try {
      await cancelSeries.mutateAsync(series.id);
      toast.success("Upcoming sessions cancelled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel series");
    }
  };

  const handleCancelSession = async () => {
    if (!sessionToCancel) return;
    try {
      await cancelSession.mutateAsync(sessionToCancel);
      toast.success("Session cancelled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel session");
    } finally {
      setSessionToCancel(null);
    }
  };

  if (seriesQuery.error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading series</h3>
          <p>{seriesQuery.error.message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  if (seriesQuery.isLoading || !series) {
    return (
      <div className="mx-auto mt-4 w-full max-w-[1600px] space-y-4 px-3 sm:px-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const dropOffPct =
    series.stats.drop_off_rate == null
      ? "—"
      : `${Math.round(series.stats.drop_off_rate * 100)}%`;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <Button variant="ghost" size="sm" className="gap-2 px-0" asChild>
        <Link href="/meetings">
          <ArrowLeft className="h-4 w-4" />
          Back to meetings
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{series.name}</h1>
            <Badge
              className={
                series.cancelled_at
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : series.is_active
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {series.cancelled_at ? "Cancelled" : series.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {MEETING_ACCESS_TYPE_LABELS[series.access_type]}
            {series.audience_label ? ` · ${series.audience_label}` : ""}
          </p>
        </div>
        {canManage && !series.cancelled_at ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelSeriesOpen(true)}
            disabled={cancelSeries.isPending}
          >
            Cancel upcoming
          </Button>
        ) : null}
      </div>

      <Card className="min-w-0 overflow-hidden border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Series overview</CardTitle>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Sessions</p>
            <p className="font-medium tabular-nums">
              {series.stats.completed_sessions} completed · {series.stats.upcoming_sessions}{" "}
              upcoming · {series.stats.cancelled_sessions} cancelled
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total attendance</p>
            <p className="font-medium tabular-nums">{series.stats.total_attendance}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Drop-off (first → last)</p>
            <p className="font-medium tabular-nums">{dropOffPct}</p>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-3">
            <p className="text-muted-foreground">Shared series link</p>
            <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
              <p className="min-w-0 max-w-full overflow-hidden break-all font-medium">
                {series.share_url}
              </p>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={copyShareUrl}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Sessions</h2>
        <Card className="min-w-0 border-none shadow-sm">
          <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
            <AdminMobileStack>
              {series.sessions.map((session) => {
                const status = sessionStatus(session);
                return (
                  <AdminMobileCard
                    key={session.id}
                    title={session.name}
                    subtitle={formatMeetingWhen(session.starts_at)}
                  >
                    <AdminMobileField
                      label="Position"
                      value={`${session.series_position ?? "—"} / ${session.series_total ?? "—"}`}
                    />
                    <AdminMobileField label="Status" value={status} />
                    <AdminMobileField
                      label="Attendance"
                      value={String(session.verification_count)}
                    />
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                        <Link href={`/meetings/${session.id}`}>
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      {canManage && status === "Upcoming" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setSessionToCancel(session.id)}
                          disabled={cancelSession.isPending}
                        >
                          Cancel session
                        </Button>
                      ) : null}
                    </div>
                  </AdminMobileCard>
                );
              })}
            </AdminMobileStack>

            <AdminDesktopTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={HEAD}>#</TableHead>
                    <TableHead className={HEAD}>Session</TableHead>
                    <TableHead className={HEAD}>Starts (WAT)</TableHead>
                    <TableHead className={HEAD}>Status</TableHead>
                    <TableHead className={`${HEAD} text-center`}>Attendance</TableHead>
                    <TableHead className={HEAD} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.sessions.map((session) => {
                    const status = sessionStatus(session);
                    return (
                      <TableRow key={session.id}>
                        <TableCell className={`${CELL} tabular-nums`}>
                          {session.series_position ?? "—"}
                        </TableCell>
                        <TableCell className={`${CELL} font-medium`}>{session.name}</TableCell>
                        <TableCell className={`${CELL} whitespace-nowrap`}>
                          {formatMeetingWhen(session.starts_at)}
                        </TableCell>
                        <TableCell className={CELL}>
                          <Badge className={statusBadgeClass(status)}>{status}</Badge>
                        </TableCell>
                        <TableCell className={`${CELL} text-center tabular-nums`}>
                          {session.verification_count}
                        </TableCell>
                        <TableCell className={`${CELL} text-right`}>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-2" asChild>
                              <Link href={`/meetings/${session.id}`}>
                                <Eye className="h-4 w-4" />
                                View
                              </Link>
                            </Button>
                            {canManage && status === "Upcoming" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSessionToCancel(session.id)}
                                disabled={cancelSession.isPending}
                              >
                                Cancel
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminDesktopTableWrap>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={cancelSeriesOpen}
        onOpenChange={setCancelSeriesOpen}
        title="Cancel all upcoming sessions?"
        description="Past and in-progress sessions keep their attendance — only future, un-cancelled sessions in this series are cancelled."
        confirmLabel="Cancel upcoming"
        onConfirm={handleCancelSeries}
      />
      <ConfirmDialog
        open={sessionToCancel !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToCancel(null);
        }}
        title="Cancel this session?"
        description="This can't be undone."
        confirmLabel="Cancel session"
        onConfirm={handleCancelSession}
      />
    </div>
  );
}
