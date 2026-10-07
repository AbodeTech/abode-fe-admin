"use client";

import { Suspense, useEffect } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";

import { FIELD_STAFF_TYPE_LABELS, assetName } from "../schemas/field-staff.schema";
import { STALE_AFTER_DAYS, useFieldBlockers, useFieldPerformanceSummary, useStaffMonth } from "../hooks/use-field-performance";
import { useFieldStaff } from "../hooks/use-field-staff";
import { useFieldScorecards, useRoleMetrics } from "../hooks/use-field-scorecards";
import { useFieldRoster } from "../hooks/use-field-roster";
import { ALL, usePerformanceParams } from "../hooks/use-performance-params";
import { formatPeriod } from "../lib/format";
import { FieldPerformanceHeader } from "./FieldPerformanceHeader";
import { FieldTeamTable } from "./FieldTeamTable";
import { NeedsAttention } from "./NeedsAttention";
import { PersonSnapshot } from "./PersonSnapshot";
import { PersonWork } from "./PersonWork";
import { TeamSnapshot } from "./TeamSnapshot";

function ErrorBox({ message }: { message?: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-[#AD1F2A]">
      <h3 className="font-bold">Error loading field performance</h3>
      <p>{message || "An unexpected error occurred."}</p>
    </div>
  );
}

/** Everyone in the role for the month: team tiles and the team table. */
function TeamView() {
  const { role, year, month, update } = usePerformanceParams();
  const roster = useFieldRoster(role, year, month);
  const roleWord = role === "site_manager" ? "site managers" : "surveyors";

  // Last month's summary gives every row its change in one call, not one per person.
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const previousSummary = useFieldPerformanceSummary(role, prevYear, prevMonth);
  const previous = new Map(
    (previousSummary.data?.workers ?? [])
      .filter((w) => w.scorecards.length > 0)
      .map((w) => [w.field_staff.id, w.total_score] as const)
  );
  const offeredMetrics = useRoleMetrics(role).metrics.length;
  const blockers = useFieldBlockers(year, month);

  const header = (
    <FieldPerformanceHeader
      staff={roster.rows.map((r) => r.staff)}
      sites={[]}
      waiting={roster.summary?.totals.pending_reviews ?? 0}
      subtitle={`All ${roleWord} · ${formatPeriod(year, month)}`}
    />
  );

  if (roster.isLoading) return <>{header}<PageContentLoader label="Loading…" /></>;
  if (roster.error || !roster.summary) return <>{header}<ErrorBox message={roster.error?.message} /></>;

  return (
    <>
      {header}
      <TeamSnapshot rows={roster.rows} summary={roster.summary} year={year} month={month} />
      <NeedsAttention
        rows={roster.rows}
        blockers={blockers.data}
        staleAfterDays={STALE_AFTER_DAYS}
        onOpen={(person, site) => update({ person, ...(site && { site }) })}
      />
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Team</h2>
          <p className="text-sm text-muted-foreground">
            Ranked by verified score. People without targets aren&apos;t ranked. Hover Targets to see what each person is
            measured on.
          </p>
        </div>
        {roster.notShown > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Showing the first {roster.rows.length} {roleWord}. {roster.notShown} more aren&apos;t in this table or the
            person menu yet — the team has outgrown a single page.
          </p>
        )}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <FieldTeamTable
            rows={roster.rows}
            previous={previous}
            previousLabel={formatPeriod(prevYear, prevMonth).split(" ")[0].slice(0, 3)}
            offeredMetrics={offeredMetrics}
            onOpen={(id) => update({ person: id })}
            emptyState={
              <p className="p-8 text-center text-sm text-muted-foreground">
                No {FIELD_STAFF_TYPE_LABELS[role].toLowerCase()}s yet. Invite one to get started.
              </p>
            }
          />
        </div>
      </section>
    </>
  );
}

/** One person's month, optionally narrowed to one site. */
function PersonView({ personId }: { personId: string }) {
  const { role, site, year, month, update } = usePerformanceParams();

  const detail = useFieldStaff(personId);
  const staffMonth = useStaffMonth(personId, year, month);
  const scorecards = useFieldScorecards({ field_staff_id: personId, year, month, limit: 100 });
  const roster = useFieldRoster(role, year, month);

  // A shared link may land a person on the other role's page — move them to their own.
  const staffType = detail.data?.field_staff.staff_type;
  useEffect(() => {
    if (staffType && staffType !== role) update({ role: staffType, person: personId, site }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `update` is rebuilt every render
  }, [staffType, role, personId, site]);

  const sites = staffMonth.data
    ? [...staffMonth.data.scorecards, ...staffMonth.data.sites_without_targets].map((s) => s.asset)
    : [];
  const siteLabel = site === ALL ? (sites.length > 1 ? "all sites" : sites[0] ? assetName(sites[0]) : "no sites") : assetName(sites.find((s) => s.id === site));

  const header = (
    <FieldPerformanceHeader
      staff={roster.rows.map((r) => r.staff)}
      sites={sites}
      waiting={staffMonth.data?.pending_submissions ?? 0}
      subtitle={
        detail.data ? `${detail.data.field_staff.full_name} · ${siteLabel} · ${formatPeriod(year, month)}` : formatPeriod(year, month)
      }
    />
  );

  if (detail.isLoading || staffMonth.isLoading || scorecards.isLoading) {
    return <>{header}<PageContentLoader label="Loading…" /></>;
  }
  const error = detail.error ?? staffMonth.error ?? scorecards.error;
  if (error || !detail.data || !staffMonth.data) return <>{header}<ErrorBox message={error?.message} /></>;

  const cards = scorecards.data?.items ?? [];
  const selectSite = (id: string) => update({ site: id });

  return (
    <>
      {header}
      <PersonSnapshot detail={detail.data} month={staffMonth.data} scorecards={cards} siteId={site} onSelectSite={selectSite} />
      <PersonWork detail={detail.data} month={staffMonth.data} scorecards={cards} siteId={site} onSelectSite={selectSite} />
    </>
  );
}

function FieldPerformanceContent() {
  const { person } = usePerformanceParams();
  return (
    <div className="space-y-6">{person === ALL ? <TeamView /> : <PersonView key={person} personId={person} />}</div>
  );
}

/**
 * A role's Field Performance page — the team, or one person when `?person=`
 * is set. The role comes from the route (see ROLE_PATHS).
 */
export function FieldPerformanceView() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading…" />}>
        <FieldPerformanceContent />
      </Suspense>
    </div>
  );
}
