"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  DEFAULT_SUBMISSIONS_LIMIT,
  QueueMetricFilter,
  ReviewQueueTable,
  StaleReviews,
  useFieldSubmissions,
  useQueueMetric,
} from "@/features/field-staff";

function ReviewQueueContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const metric = useQueueMetric();

  const queue = useFieldSubmissions({ status: "submitted", metric_key: metric, page });

  if (queue.isLoading) return <PageContentLoader label="Loading review queue…" />;

  if (queue.error || !queue.data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-[#AD1F2A]">
        <h3 className="font-bold">Error loading the review queue</h3>
        <p>{queue.error?.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const { items, meta } = queue.data;
  const total = meta.total ?? items.length;

  return (
    <section className="rounded-xl border bg-white">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">
          {total} submission{total === 1 ? "" : "s"} waiting
        </h2>
        <p className="text-xs text-muted-foreground">One decision verifies the work and its recorded cost together.</p>
      </header>
      <div className="p-2 lg:p-0">
        <ReviewQueueTable
          rows={items}
          emptyState={
            <div className="p-8 text-center">
              <p className="font-medium">Nothing to review</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Work appears here as soon as a Site Manager or Surveyor sends it for review.
              </p>
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

export default function ReviewQueuePage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading review queue…" />}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Review queue</h1>
            <p className="text-muted-foreground">
              Field work from Site Managers and Surveyors waiting to be verified or rejected.
            </p>
          </div>
          <QueueMetricFilter />
        </div>
        <StaleReviews />
        <ReviewQueueContent />
      </Suspense>
    </div>
  );
}
