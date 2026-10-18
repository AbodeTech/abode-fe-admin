"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  CourseFilterChips,
  CourseSearch,
  CoursesTable,
  CreateCourseDialog,
  DEFAULT_COURSE_LIMIT,
  useAcademySettings,
  useCourseList,
  useCourseSummary,
  type CourseAudience,
  type CourseStatus,
} from "@/features/courses";
import { getErrorMessage } from "@/features/courses/utils/error-message";

const EMPTY_SUMMARY = { total: 0, published: 0, draft: 0, realtor: 0, buyer: 0 };

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function CoursesPageContent() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? "";
  const status = (searchParams.get("status") as CourseStatus) || undefined;
  const audience = (searchParams.get("audience") as CourseAudience) || undefined;
  const hasFilters = Boolean(search || status || audience);

  const { data, isLoading, error } = useCourseList({
    page,
    limit: DEFAULT_COURSE_LIMIT,
    search,
    status,
    audience,
  });
  const { data: summary } = useCourseSummary();
  const { data: academySettings } = useAcademySettings();

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading courses</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CourseFilterChips summary={summary ?? EMPTY_SUMMARY} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CourseSearch />
        <CreateCourseDialog />
      </div>

      <CoursesTable
        rows={data?.items ?? []}
        isLoading={isLoading}
        firstSalePathCourseId={academySettings?.first_sale_path_course_id}
        emptyState={
          hasFilters ? (
            <EmptyState
              title="No courses match these filters"
              body="Clear or widen the filters to see the rest of the catalogue."
            />
          ) : (
            <EmptyState title="No courses yet" body="Create one to start building out the academy." />
          )
        }
      />

      <Pagination
        count={data?.meta.total ?? 0}
        currentIdx={data?.meta.page ?? page}
        limit={data?.meta.limit ?? DEFAULT_COURSE_LIMIT}
      />
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Every course in the academy. First sale path and Certification are role tags a course earns
          from its own settings, not separate features.
        </p>
      </div>

      <Suspense fallback={<SuspensePageFallback />}>
        <CoursesPageContent />
      </Suspense>
    </div>
  );
}
