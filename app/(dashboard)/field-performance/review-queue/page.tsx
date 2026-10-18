"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  DEFAULT_SUBMISSIONS_LIMIT,
  QueueMetricFilter,
  QueueStatusTabs,
  ReviewQueueTable,
  StaleReviews,
  useFieldStaff,
  useFieldSubmissions,
  useQueueMetric,
  useQueueTab,
} from "@/features/field-staff";

const EMPTY: Record<string, { title: string; body: string }> = {
  waiting: {
    title: "Nothing to review",
    body: "Work appears here as soon as a Site Manager or Surveyor sends it for review.",
  },
  verified: { title: "Nothing verified yet", body: "Verified work appears here once it's been reviewed." },
  rejected: { title: "Nothing rejected", body: "Rejected work appears here with the reason it was sent back." },
  reversed: { title: "Nothing reversed", body: "Verified work that was later taken back out appears here." },
};

function ReviewQueueContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const staffId = searchParams.get("staff") || undefined;
  const metric = useQueueMetric();
  const tab = useQueueTab();
  const waiting = tab.key === "waiting";

  const list = useFieldSubmissions({ status: tab.status, metric_key: metric, field_staff_id: staffId, page });

  if (list.isLoading) return <PageContentLoader label="Loading…" />;

  if (list.error || !list.data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-[#AD1F2A]">
        <h3 className="font-bold">Error loading submissions</h3>
        <p>{list.error?.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const { items, meta } = list.data;
  const total = meta.total ?? items.length;
  const plural = total === 1 ? "" : "s";

  return (
    <section className="rounded-xl border bg-white">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">
          {total} submission{plural} {waiting ? "waiting" : tab.label.toLowerCase()}
        </h2>
        <p className="text-xs text-muted-foreground">
          {waiting
            ? "One decision verifies the work and its recorded cost together."
            : "Newest work first. Open one to see the full record, its evidence and the decision."}
        </p>
      </header>
      <div className="p-2 lg:p-0">
        <ReviewQueueTable
          rows={items}
          mode={waiting ? "queue" : "history"}
          emptyState={
            <div className="p-8 text-center">
              <p className="font-medium">{EMPTY[tab.key].title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{EMPTY[tab.key].body}</p>
            </div>
          }
        />
      </div>
      <div className="px-4">
        <Pagination count={total} currentIdx={page} limit={DEFAULT_SUBMISSIONS_LIMIT} />
      </div>
    </section>
  );
}

/** `?staff=` narrows the page to one person — linked from their performance page. */
function StaffFilterChip({ staffId }: { staffId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const staff = useFieldStaff(staffId);

  const next = new URLSearchParams(searchParams.toString());
  next.delete("staff");
  next.delete("page");
  const query = next.toString();

  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm">
      Only {staff.data ? staff.data.field_staff.full_name : "one person"}&apos;s work
      <Link
        href={query ? `${pathname}?${query}` : pathname}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Show everyone's work"
      >
        <X className="h-3.5 w-3.5" />
      </Link>
    </span>
  );
}

function ReviewQueueBody() {
  const tab = useQueueTab();
  const staffId = useSearchParams().get("staff");
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <QueueStatusTabs />
          {staffId && <StaffFilterChip staffId={staffId} />}
        </div>
        <QueueMetricFilter />
      </div>
      {tab.key === "waiting" && !staffId && <StaleReviews />}
      <ReviewQueueContent />
    </>
  );
}

export default function ReviewQueuePage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
        <p className="text-muted-foreground">
          Field work from Site Managers and Surveyors — what&apos;s waiting, and every decision made on it.
        </p>
      </div>
      <Suspense fallback={<PageContentLoader label="Loading…" />}>
        <ReviewQueueBody />
      </Suspense>
    </div>
  );
}
