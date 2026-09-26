"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  ALL,
  FIELD_STAFF_TYPE_LABELS,
  FieldPerformanceHeader,
  FieldTeamTable,
  PersonSnapshot,
  PersonWork,
  TeamSnapshot,
  assetName,
  formatPeriod,
  useFieldRoster,
  useFieldScorecards,
  useFieldStaff,
  usePerformanceParams,
  useStaffMonth,
} from "@/features/field-staff";

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
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Team</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <FieldTeamTable
            rows={roster.rows}
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, site, year, month, update } = usePerformanceParams();

  const detail = useFieldStaff(personId);
  const staffMonth = useStaffMonth(personId, year, month);
  const scorecards = useFieldScorecards({ field_staff_id: personId, year, month, limit: 100 });
  const roster = useFieldRoster(role, year, month);

  // A shared link may name a person without their role — line the role tabs up with them.
  const staffType = detail.data?.field_staff.staff_type;
  useEffect(() => {
    if (staffType && staffType !== role) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("role", staffType);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [staffType, role, pathname, router, searchParams]);

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

export default function FieldPerformancePage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading…" />}>
        <FieldPerformanceContent />
      </Suspense>
    </div>
  );
}
