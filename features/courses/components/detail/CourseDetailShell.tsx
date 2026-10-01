"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { cn } from "@/lib/utils";

import { useAcademySettings, useCourseDetail } from "../../hooks/use-course-detail";
import { useCourseLearners } from "../../hooks/use-learners";
import { useCourseQuiz } from "../../hooks/use-quiz";
import { getErrorMessage } from "../../utils/error-message";

type Tab = {
  key: string;
  label: string;
  href: (id: string) => string;
  count: number;
};

/**
 * Header, status badges and tab nav — shared by every course sub-route.
 * Everything here is real: course record, module count, quiz question count
 * (derived via `useCourseQuiz` — the BE ties a quiz to a module, not a
 * course, so this scans the course's modules for the first one with a quiz),
 * and learner count.
 *
 * Only wraps the four tab routes (overview/modules/quiz/learners) — the
 * module editor is a drill-down from Modules with its own breadcrumb-only
 * shell (see ModuleEditorShell), not these tabs.
 */
export function CourseDetailShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { data: course, isLoading, error } = useCourseDetail(params.id);
  const { data: academySettings } = useAcademySettings();
  const { data: learners } = useCourseLearners(course?.id ?? "", { page: 1, limit: 1 });
  const { data: courseQuiz } = useCourseQuiz(course?.id ?? "");

  if (isLoading) return <PageContentLoader label="Loading course…" />;

  if (error || !course) {
    return (
      <div className="mx-auto mt-4 w-full min-w-0 max-w-[1200px] px-3 sm:px-4">
        <Link
          href="/academy/courses"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to courses
        </Link>
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Couldn&apos;t load this course</h3>
          <p>{getErrorMessage(error, "It may have been deleted.")}</p>
        </div>
      </div>
    );
  }

  const tabs: Tab[] = [
    {
      key: "overview",
      label: "Overview",
      href: (id) => `/academy/courses/${id}`,
      count: 0,
    },
    {
      key: "modules",
      label: "Modules",
      href: (id) => `/academy/courses/${id}/modules`,
      count: course.modules.length,
    },
    {
      key: "quiz",
      label: "Quiz",
      href: (id) => `/academy/courses/${id}/quiz`,
      count: courseQuiz?.settings.question_count ?? 0,
    },
    {
      key: "learners",
      label: "Learners",
      href: (id) => `/academy/courses/${id}/learners`,
      count: learners?.meta.total ?? 0,
    },
  ];

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1200px] space-y-5 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="space-y-2">
        <Link
          href="/academy/courses"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to courses
        </Link>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight wrap-break-word">
              {course.title}
            </h1>
          </div>

          <div className="flex shrink-0 gap-2">
            {academySettings?.first_sale_path_course_id === course.id ? (
              <Badge>First sale path</Badge>
            ) : null}
            {course.grants_credential ? (
              <Badge variant="outline">Grants a credential</Badge>
            ) : null}
            <Badge
              variant={course.status === "published" ? "default" : "secondary"}
            >
              {course.status === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="-mb-1 flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => {
          const href = tab.href(course.id);
          const isActive = pathname === href;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count > 0 ? (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {tab.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="min-w-0 mt-5">{children}</div>
    </div>
  );
}
