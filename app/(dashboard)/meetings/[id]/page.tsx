"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_MEETINGS_LIMIT,
  EditMeetingDialog,
  formatMeetingWhen,
  MEETING_ACCESS_TYPE_LABELS,
  meetingAudienceDisplay,
  meetingSeriesPositionLabel,
  useIsMeetingLive,
  useMeeting,
  useMeetingVerifications,
  useToggleMeetingActive,
  VerificationsTable,
} from "@/features/meetings";

function MeetingDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const page = Number(searchParams.get("page")) || 1;
  const canManage = useHasPermission("manage_meetings");
  const [editOpen, setEditOpen] = useState(false);

  const meetingQuery = useMeeting(id);
  const meeting = meetingQuery.data;
  // Only poll the join log while this session's verification window is
  // actually open — see docs on useIsMeetingLive/useMeetingVerifications.
  const live = useIsMeetingLive(meeting);
  const verificationsQuery = useMeetingVerifications(id, {
    page,
    limit: DEFAULT_MEETINGS_LIMIT,
    live,
  });
  const toggle = useToggleMeetingActive();

  const copyShareUrl = async () => {
    if (!meeting?.share_url) return;
    try {
      await navigator.clipboard.writeText(meeting.share_url);
      toast.success("Share URL copied");
    } catch {
      toast.error("Could not copy share URL");
    }
  };

  const handleToggle = async () => {
    if (!meeting) return;
    try {
      await toggle.mutateAsync({ id: meeting.id, is_active: !meeting.is_active });
      toast.success(meeting.is_active ? "Meeting deactivated" : "Meeting activated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update meeting");
    }
  };

  if (meetingQuery.error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading meeting</h3>
          <p>{meetingQuery.error.message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {meeting?.name ?? "Meeting"}
            </h1>
            {meeting ? (
              <Badge
                className={
                  meeting.is_active
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                }
              >
                {meeting.is_active ? "Active" : "Inactive"}
              </Badge>
            ) : null}
          </div>
          {meeting ? (
            <p className="text-sm text-muted-foreground">
              {meeting.access_type
                ? `${MEETING_ACCESS_TYPE_LABELS[meeting.access_type]} · `
                : ""}
              {meetingAudienceDisplay(meeting)} · {formatMeetingWhen(meeting.starts_at)} WAT
            </p>
          ) : null}
        </div>
        {meeting && canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant={meeting.is_active ? "outline" : "default"}
              size="sm"
              onClick={handleToggle}
              disabled={toggle.isPending}
            >
              {meeting.is_active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ) : null}
      </div>

      {meeting ? (
        <>
          <Card className="min-w-0 overflow-hidden border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid min-w-0 gap-4 overflow-hidden text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Slug</p>
                <p className="font-medium">{meeting.slug}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Series</p>
                <p className="font-medium">
                  {/* Not a link: the real BE has no series-detail endpoint
                      (see docs/ACADEMY-BACKEND-GAPS.md §2) — a link here
                      would 404. */}
                  {meeting.series_id && meeting.series_name
                    ? `${meeting.series_name} (${meetingSeriesPositionLabel(meeting)})`
                    : meetingSeriesPositionLabel(meeting)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {meeting.duration_minutes ?? DEFAULT_DURATION_MINUTES} minutes
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ends (WAT)</p>
                <p className="font-medium">
                  {meeting.ends_at ? formatMeetingWhen(meeting.ends_at) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Verification opens</p>
                <p className="font-medium">{meeting.verification_lead_minutes} minutes before start</p>
              </div>
              {meeting.access_type === "physical" && meeting.venue ? (
                <div>
                  <p className="text-muted-foreground">Venue</p>
                  <p className="font-medium">
                    {meeting.venue}
                    {meeting.city ? `, ${meeting.city}` : ""}
                  </p>
                </div>
              ) : null}
              {meeting.access_type === "physical" ? (
                <div>
                  <p className="text-muted-foreground">Date confirmed</p>
                  <p className="font-medium">
                    {meeting.details_confirmed ? "Yes — QR issued" : "No — QR held"}
                  </p>
                </div>
              ) : null}
              <div className="min-w-0 overflow-hidden sm:col-span-2">
                <p className="text-muted-foreground">Share URL</p>
                <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
                  <p className="min-w-0 max-w-full overflow-hidden break-all font-medium">
                    {meeting.share_url}
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={copyShareUrl}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    {meeting.google_meet_url ? (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={meeting.google_meet_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Meet
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matches the stat-card look from the cohort dashboard (CohortStatCards) —
              rounded-2xl, soft border, icon chip — instead of the plain shadcn
              Card the rest of this page uses, since this is a metric, not a form section. */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Verifications
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {meeting.stats.total_verifications.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Users size={18} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {meeting.stats.by_referral_status.length === 0 ? (
                <p className="text-sm text-slate-500">No breakdown yet.</p>
              ) : (
                meeting.stats.by_referral_status.map((row) => (
                  <Badge key={row.referral_status ?? "unknown"} variant="secondary">
                    {row.referral_status ?? "unknown"}: {row.count}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold">Join log</h2>
            <p className="text-sm text-muted-foreground">
              {live
                ? "Verification is open — refreshes every 5 seconds."
                : "Verification isn't open for this session, so this isn't polling."}
            </p>
            {verificationsQuery.error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <p className="font-medium">Could not load the join log</p>
                <p>{verificationsQuery.error.message}</p>
              </div>
            ) : (
              <VerificationsTable
                rows={verificationsQuery.data?.items ?? []}
                isLoading={verificationsQuery.isLoading}
              />
            )}
            {(verificationsQuery.data?.meta.total ?? 0) > DEFAULT_MEETINGS_LIMIT ? (
              <Pagination
                count={verificationsQuery.data?.meta.total ?? 0}
                currentIdx={page}
                limit={DEFAULT_MEETINGS_LIMIT}
              />
            ) : null}
          </div>

          <EditMeetingDialog meeting={meeting} open={editOpen} onOpenChange={setEditOpen} />
        </>
      ) : null}
    </div>
  );
}

export default function MeetingDetailPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <MeetingDetailContent />
    </Suspense>
  );
}
