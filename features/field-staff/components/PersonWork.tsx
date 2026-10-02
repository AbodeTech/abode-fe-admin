"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { FIELD_RESPONSIBILITY_LABELS, assetName, type FieldStaffDetail } from "../schemas/field-staff.schema";
import type { FieldScorecard } from "../schemas/scorecard.schema";
import type { SubmissionStatus } from "../schemas/submission.schema";
import type { StaffMonth } from "../schemas/performance.schema";
import { ALL } from "../hooks/use-performance-params";
import { useFieldSubmissions } from "../hooks/use-field-submissions";
import { formatDate, formatNaira, formatScore, waitingFor } from "../lib/format";
import { AssignmentHistory } from "./AssignmentHistory";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";

interface PersonWorkProps {
  detail: FieldStaffDetail;
  month: StaffMonth;
  scorecards: FieldScorecard[];
  siteId: string;
  onSelectSite: (assetId: string) => void;
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {aside}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">{children}</div>
    </section>
  );
}

const Loading = () => (
  <div className="flex justify-center py-8">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

/** Past this, Needs review links to the queue rather than paging here too. */
const WAITING_LIMIT = 20;
const RECENT_LIMIT = 10;
const RECENT_TABS = [
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "reversed", label: "Reversed" },
] as const satisfies readonly { key: SubmissionStatus; label: string }[];

/**
 * The month's reviewed work, one decision per tab. The list endpoint filters by
 * a single status and returns drafts when unfiltered, so "everything reviewed"
 * can't be one paged request. Remount (via `key`) to reset on site or month.
 */
function RecentWork({
  staffId,
  assetId,
  year,
  month,
  onOpen,
}: {
  staffId: string;
  assetId: string | undefined;
  year: number;
  month: number;
  onOpen: (id: string) => void;
}) {
  const [status, setStatus] = useState<(typeof RECENT_TABS)[number]["key"]>("verified");
  const [page, setPage] = useState(1);
  const recent = useFieldSubmissions({
    field_staff_id: staffId,
    asset_id: assetId,
    year,
    month,
    status,
    page,
    limit: RECENT_LIMIT,
  });
  const rows = recent.data?.items ?? [];
  const total = recent.data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / RECENT_LIMIT));

  return (
    <Section
      title="Recent work"
      aside={
        <div className="inline-flex rounded-lg bg-muted p-1" role="tablist" aria-label="Decision">
          {RECENT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={status === t.key}
              onClick={() => {
                setStatus(t.key);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                status === t.key ? "bg-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {recent.isLoading ? (
        <Loading />
      ) : recent.error ? (
        <Empty>{recent.error.message}</Empty>
      ) : rows.length === 0 ? (
        <Empty>Nothing {status} this month.</Empty>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work</TableHead>
                <TableHead className="hidden sm:table-cell">Site</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((sub) => (
                <TableRow key={sub.id} className="cursor-pointer" onClick={() => onOpen(sub.id)}>
                  <TableCell>{sub.summary}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{assetName(sub.asset)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(sub.work_date)}</TableCell>
                  <TableCell className="text-right">
                    <SubmissionStatusBadge status={sub.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-2 text-xs text-muted-foreground">
              <span>
                {(page - 1) * RECENT_LIMIT + 1}–{Math.min(page * RECENT_LIMIT, total)} of {total}
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="p-6 text-center text-sm text-muted-foreground">{children}</p>
);

/** Below the snapshot: what's waiting, their sites, and what they've recorded. */
export function PersonWork({ detail, month, scorecards, siteId, onSelectSite }: PersonWorkProps) {
  const [reviewing, setReviewing] = useState<string | null>(null);
  const staff = detail.field_staff;
  const assetFilter = siteId === ALL ? undefined : siteId;

  // Waiting work from any month — a submission shouldn't vanish because the month changed.
  const waiting = useFieldSubmissions({
    status: "submitted",
    field_staff_id: staff.id,
    asset_id: assetFilter,
    limit: WAITING_LIMIT,
  });
  const waitingTotal = waiting.data?.meta.total ?? 0;

  const sites = [...month.scorecards, ...month.sites_without_targets];
  const roleFor = (assetId: string) =>
    detail.assignments.find((a) => a.asset?.id === assetId && a.status !== "ended")?.responsibility;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Section
          title="Needs review"
          aside={
            waitingTotal > 0 ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {waitingTotal}
              </span>
            ) : undefined
          }
        >
          {waiting.isLoading ? (
            <Loading />
          ) : waiting.error ? (
            <Empty>{waiting.error.message}</Empty>
          ) : !waiting.data?.items.length ? (
            <Empty>Nothing waiting. New work shows up here as soon as it&apos;s sent.</Empty>
          ) : (
            <ul className="divide-y">
              {waiting.data.items.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{sub.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {assetName(sub.asset)} · {waitingFor(sub.submitted_at)}
                      {sub.amount_spent !== null && ` · ${formatNaira(sub.amount_spent)}`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setReviewing(sub.id)}>
                    Review
                  </Button>
                </li>
              ))}
              {waitingTotal > waiting.data.items.length && (
                <li className="px-4 py-2.5">
                  <Link
                    href={`/field-performance/review-queue?staff=${staff.id}`}
                    className="text-xs font-medium text-[#00695C] hover:underline"
                  >
                    Showing {waiting.data.items.length} of {waitingTotal} · see all of {staff.full_name}&apos;s waiting work
                    in the review queue →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </Section>

        <Section title="Sites">
          {sites.length === 0 ? (
            <Empty>No sites this month.</Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-center">Targets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => {
                  const card = scorecards.find((c) => c.asset?.id === site.asset.id);
                  const role = roleFor(site.asset.id);
                  const scored = site.metrics.length > 0;
                  return (
                    <TableRow
                      key={site.asset.id}
                      className="cursor-pointer data-[on=true]:bg-[#E0F2F1]/50"
                      data-on={siteId === site.asset.id}
                      onClick={() => onSelectSite(site.asset.id)}
                    >
                      <TableCell>
                        <p className="font-medium">{assetName(site.asset)}</p>
                        {role && <p className="text-xs text-muted-foreground">{FIELD_RESPONSIBILITY_LABELS[role]}</p>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatScore(scored ? site.score : null)}</TableCell>
                      <TableCell className="text-center">
                        {scored ? (
                          <span className="rounded-full bg-[#E0F2F1] px-2 py-0.5 text-xs font-medium text-[#00695C]">
                            Published
                          </span>
                        ) : card?.state === "draft" || card?.state === "restated" ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Draft
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-[#AD1F2A]">
                            None
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>

      <RecentWork
        key={`${assetFilter ?? ALL}-${month.year}-${month.month}`}
        staffId={staff.id}
        assetId={assetFilter}
        year={month.year}
        month={month.month}
        onOpen={setReviewing}
      />

      <AssignmentHistory staff={staff} />

      <SubmissionReviewDialog submissionId={reviewing} onOpenChange={(open) => !open && setReviewing(null)} />
    </div>
  );
}
