"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  CourseFilterChips,
  CourseSearch,
  CoursesTable,
  CreateCourseDialog,
  DEFAULT_COURSE_LIMIT,
  DUMMY_COURSES,
  type Course,
  type CourseAudience,
  type CourseStatus,
} from "@/features/courses";

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

/**
 * Design preview — abode-be-v2 has no courses endpoints yet, so this page
 * runs entirely on features/courses/dummy-data.ts, held in local state so
 * "New course" has somewhere to append to. Refreshing resets it. Swap in
 * useCourseList / useCourseSummary (already written, see hooks/) once the
 * BE ships /admin/courses.
 */
function CoursesPageContent({
  courses,
  onCreate,
}: {
  courses: Course[];
  onCreate: (course: Course) => void;
}) {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const status = (searchParams.get("status") as CourseStatus) || undefined;
  const audience = (searchParams.get("audience") as CourseAudience) || undefined;

  const summary = {
    total: courses.length,
    published: courses.filter((c) => c.status === "published").length,
    draft: courses.filter((c) => c.status === "draft").length,
    realtor: courses.filter((c) => c.audience === "realtor").length,
    buyer: courses.filter((c) => c.audience === "buyer").length,
  };

  const filtered = courses
    .filter((c) => (status ? c.status === status : true))
    .filter((c) => (audience ? c.audience === audience : true))
    .filter((c) => (search ? c.title.toLowerCase().includes(search) : true));

  const total = filtered.length;
  const start = (page - 1) * DEFAULT_COURSE_LIMIT;
  const rows = filtered.slice(start, start + DEFAULT_COURSE_LIMIT);
  const hasFilters = Boolean(search || status || audience);

  return (
    <div className="space-y-4">
      <CourseFilterChips summary={summary} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CourseSearch />
        <CreateCourseDialog onCreate={onCreate} />
      </div>

      <CoursesTable
        rows={rows}
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

      <Pagination count={total} currentIdx={page} limit={DEFAULT_COURSE_LIMIT} />
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(DUMMY_COURSES);

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Every course in the academy. First sale path and Certification are role tags a course earns
          from its own settings, not separate features.
        </p>
      </div>

      <Suspense fallback={<PageContentLoader label="Loading courses…" />}>
        <CoursesPageContent
          courses={courses}
          onCreate={(course) => setCourses((prev) => [course, ...prev])}
        />
      </Suspense>
    </div>
  );
}
