"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  ConversionMetricsSection,
  GraphsSection,
  KeyMetricsSection,
  MAX_TRACKER_YEAR,
  MIN_TRACKER_YEAR,
  SectionErrorBoundary,
  TrackerHeader,
  useYearsList,
} from "@/features/associate-pro-tracker";

/* ============================================================
 * /associate-pros/tracker?year=YYYY
 *
 * Was /campaigns/2000associateprocampaign — the "2000 campaign" framing no
 * longer applies, and next.config.ts redirects the old path.
 *
 * Three sections the design doc specifies are absent: the recruitment,
 * upgrades and payment-plan tables. abode-be-v2's tracker module exposes only
 * the dashboard, the year list and the goal read/write, so those tables have
 * no data source. Tracked in docs/TRANSACTION-STATS-GAPS.md.
 * ============================================================ */

function TrackerContent() {
  const searchParams = useSearchParams();
  const { data: years } = useYearsList();

  const requested = Number(searchParams.get("year"));
  const isValidYear =
    Number.isInteger(requested) &&
    requested >= MIN_TRACKER_YEAR &&
    requested <= MAX_TRACKER_YEAR;

  // An out-of-range `?year=` falls back rather than 400ing on the BE's
  // YearParamDto, which bounds the year the same way.
  const year = isValidYear
    ? requested
    : (years?.current_year ?? new Date().getFullYear());

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <TrackerHeader year={year} />

      {/* Each section owns its own boundary, so one failing query can't blank
          the page — and its own loading state, so they stream in rather than
          waiting behind a single spinner. */}
      <SectionErrorBoundary section="key metrics">
        <KeyMetricsSection year={year} />
      </SectionErrorBoundary>

      <SectionErrorBoundary section="conversion">
        <ConversionMetricsSection year={year} />
      </SectionErrorBoundary>

      <SectionErrorBoundary section="trends">
        <GraphsSection year={year} />
      </SectionErrorBoundary>
    </div>
  );
}

export default function AssociateProTrackerPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <TrackerContent />
    </Suspense>
  );
}
