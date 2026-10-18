"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

import { STALE_AFTER_DAYS, useFieldBlockers } from "../hooks/use-field-performance";
import { useFieldMetrics } from "../hooks/use-field-scorecards";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";

const PREVIEW = 5;

/**
 * Old submissions, oldest first, above the review queue. The queue itself is
 * sorted newest-work-first by the BE with no way to flip it, so the blockers
 * endpoint (which is oldest-first) is what surfaces these. Hidden when none.
 */
export function StaleReviews() {
  const now = new Date();
  const blockers = useFieldBlockers(now.getFullYear(), now.getMonth() + 1);
  const metrics = useFieldMetrics();
  const [showAll, setShowAll] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const stale = blockers.data?.stale_reviews ?? [];
  if (stale.length === 0) return null;

  const labelOf = (key: string) => metrics.data?.metrics.find((m) => m.key === key)?.label ?? key;
  const shown = showAll ? stale : stale.slice(0, PREVIEW);

  return (
    <section className="rounded-xl border border-red-200 bg-red-50/40">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-red-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#AD1F2A]" aria-hidden />
          <h2 className="text-sm font-semibold text-gray-900">
            {stale.length} waiting more than {STALE_AFTER_DAYS} days
          </h2>
        </div>
        <p className="text-xs text-gray-500">Oldest first</p>
      </header>
      <ul className="divide-y divide-red-100">
        {shown.map((s) => (
          <li key={s.submission_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-gray-900">
                {labelOf(s.metric_key)} · {s.field_staff.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {s.asset.name ?? "Removed site"}
                {s.days_waiting != null && (
                  <span className="font-medium text-[#AD1F2A]"> · waiting {s.days_waiting} days</span>
                )}
              </p>
            </div>
            <Button size="sm" variant="outline" className="bg-white" onClick={() => setReviewing(s.submission_id)}>
              Review
            </Button>
          </li>
        ))}
      </ul>
      {stale.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full border-t border-red-200 px-4 py-2 text-left text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          {showAll ? "Show fewer" : `Show all ${stale.length}`}
        </button>
      )}
      <SubmissionReviewDialog submissionId={reviewing} onOpenChange={(open) => !open && setReviewing(null)} />
    </section>
  );
}
