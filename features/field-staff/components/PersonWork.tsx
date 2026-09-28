"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { FIELD_RESPONSIBILITY_LABELS, assetName, type FieldStaffDetail } from "../schemas/field-staff.schema";
import type { FieldScorecard } from "../schemas/scorecard.schema";
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

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="p-6 text-center text-sm text-muted-foreground">{children}</p>
);

/** Below the snapshot: what's waiting, their sites, and what they've recorded. */
export function PersonWork({ detail, month, scorecards, siteId, onSelectSite }: PersonWorkProps) {
  const [reviewing, setReviewing] = useState<string | null>(null);
  const staff = detail.field_staff;
  const assetFilter = siteId === ALL ? undefined : siteId;

  // Waiting work from any month — a submission shouldn't vanish because the month changed.
  const waiting = useFieldSubmissions({ status: "submitted", field_staff_id: staff.id, asset_id: assetFilter, limit: 20 });
  const recent = useFieldSubmissions({
    field_staff_id: staff.id,
    asset_id: assetFilter,
    year: month.year,
    month: month.month,
    limit: 10,
  });
  const recentRows = (recent.data?.items ?? []).filter((s) => s.status !== "draft" && s.status !== "submitted");

  const sites = [...month.scorecards, ...month.sites_without_targets];
  const roleFor = (assetId: string) =>
    detail.assignments.find((a) => a.asset?.id === assetId && a.status !== "ended")?.responsibility;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Section
          title="Needs review"
          aside={
            (waiting.data?.meta.total ?? 0) > 0 ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {waiting.data?.meta.total}
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

      <Section title="Recent work">
        {recent.isLoading ? (
          <Loading />
        ) : recent.error ? (
          <Empty>{recent.error.message}</Empty>
        ) : recentRows.length === 0 ? (
          <Empty>Nothing reviewed this month yet.</Empty>
        ) : (
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
              {recentRows.map((sub) => (
                <TableRow key={sub.id} className="cursor-pointer" onClick={() => setReviewing(sub.id)}>
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
        )}
      </Section>

      <AssignmentHistory staff={staff} />

      <SubmissionReviewDialog submissionId={reviewing} onOpenChange={(open) => !open && setReviewing(null)} />
    </div>
  );
}
