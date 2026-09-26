"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  FIELD_RESPONSIBILITY_LABELS,
  FIELD_STAFF_TYPE_LABELS,
  assetName,
  staffInitials,
  type FieldStaffDetail,
} from "../schemas/field-staff.schema";
import { SCORECARD_STATE_LABELS, type FieldScorecard } from "../schemas/scorecard.schema";
import type { StaffMonth } from "../schemas/performance.schema";
import { ALL } from "../hooks/use-performance-params";
import { AssignSiteButton } from "./AssignSiteButton";
import { MetricTile, ScoreTile, mergeMetrics } from "./MetricTiles";
import { ScorecardActions } from "./ScorecardActions";
import { StaffAccountMenu, StaffStatusBadge } from "./StaffAccountControls";
import { PeriodPill } from "./TeamSnapshot";

interface PersonSnapshotProps {
  detail: FieldStaffDetail;
  month: StaffMonth;
  /** Current scorecard versions for the month, drafts included — the performance read leaves drafts out. */
  scorecards: FieldScorecard[];
  /** An asset id, or ALL. */
  siteId: string;
  onSelectSite: (assetId: string) => void;
}

/** Why a site isn't scored: no targets at all, or targets that aren't published yet. */
function unscoredReason(card: FieldScorecard | undefined): string {
  if (card?.state === "draft") return "has draft targets that aren't published";
  if (card?.state === "restated") return "was reopened and needs its targets published again";
  return "has no targets this month";
}

/** One person's month: who they are, the target state, and a KPI tile per target. */
export function PersonSnapshot({ detail, month, scorecards, siteId, onSelectSite }: PersonSnapshotProps) {
  const { field_staff: staff, assignments } = detail;
  const allSites = [...month.scorecards, ...month.sites_without_targets];
  const shown = siteId === ALL ? allSites : allSites.filter((s) => s.asset.id === siteId);
  const scored = shown.filter((s) => s.metrics.length > 0);
  const unscored = shown.filter((s) => s.metrics.length === 0);
  const invalid = shown.filter((s) => s.scorecard_state === "invalid");

  // The one site the scorecard buttons act on — only when a single site is in view.
  const focus = siteId !== ALL ? shown[0] : allSites.length === 1 ? allSites[0] : undefined;
  const focusCard = focus ? scorecards.find((c) => c.asset?.id === focus.asset.id) : undefined;

  const score =
    siteId === ALL ? (month.scorecards.length ? month.total_score : null) : scored[0] ? scored[0].score : null;
  const metrics = mergeMetrics(scored.flatMap((s) => s.metrics));

  const rolesText = [
    ...new Set(
      assignments
        .filter((a) => a.status !== "ended" && allSites.some((s) => s.asset.id === a.asset?.id))
        .map((a) => FIELD_RESPONSIBILITY_LABELS[a.responsibility])
    ),
  ].join(" / ");

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E0F2F1] text-sm font-semibold text-[#00695C]">
            {staffInitials(staff)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
              {staff.full_name}
              <StaffStatusBadge status={staff.status} />
            </p>
            <p className="truncate text-xs text-gray-500">
              {FIELD_STAFF_TYPE_LABELS[staff.staff_type]} ·{" "}
              {allSites.length
                ? `${allSites.length} site${allSites.length === 1 ? "" : "s"}${rolesText ? ` · ${rolesText}` : ""}`
                : "No sites this month"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AssignSiteButton staff={staff} />
          <StaffAccountMenu staff={staff} />
        </div>
      </div>

      {allSites.length === 0 ? (
        <Banner>Not assigned to a site this month. Assigning a site sets its targets at the same time.</Banner>
      ) : unscored.length > 0 && siteId === ALL && allSites.length > 1 ? (
        <Banner
          action={
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
              onClick={() => onSelectSite(unscored[0].asset.id)}
            >
              Set targets →
            </Button>
          }
        >
          {unscored
            .map((s) => `${assetName(s.asset)} ${unscoredReason(scorecards.find((c) => c.asset?.id === s.asset.id))}`)
            .join(". ")}
          .
        </Banner>
      ) : (
        <PeriodPill year={month.year} month={month.month} />
      )}

      {invalid.length > 0 && (
        <Banner>
          {invalid.map((s) => assetName(s.asset)).join(", ")}: weights don&apos;t total 100%, so the score isn&apos;t
          comparable.
        </Banner>
      )}

      {focus && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-sm">
            <span className="font-medium">{assetName(focus.asset)}</span>
            <span className="text-gray-500">
              {" · "}
              {focusCard
                ? `${SCORECARD_STATE_LABELS[focusCard.state]} targets, version ${focusCard.version}`
                : unscoredReason(focusCard)}
            </span>
          </p>
          <ScorecardActions
            staff={{ id: staff.id, name: staff.full_name, staff_type: staff.staff_type }}
            asset={{ id: focus.asset.id, name: assetName(focus.asset) }}
            year={month.year}
            month={month.month}
            scorecard={focusCard ?? null}
          />
        </div>
      )}

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreTile
            score={score}
            note={siteId === ALL && scored.length > 1 ? `Average of ${scored.length} sites` : "This site"}
          />
          {metrics.map((m) => (
            <MetricTile key={m.metric_key} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function Banner({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <p className="flex items-start gap-2 text-sm text-amber-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{children}</span>
      </p>
      {action}
    </div>
  );
}
