"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { DUMMY_COURSES } from "../../dummy-data";
import { getQuizModuleForCourse } from "../../dummy-modules";
import { getQuizForModule } from "../../dummy-quiz";

type Tab = {
  key: string;
  label: string;
  href: (id: string) => string;
  count: number;
};

/**
 * Header, status badges and tab nav — shared by every course sub-route.
 * Design preview: reads the same static fixtures as the pages beneath it, so
 * the badges/counts here reflect fixture state, not any edits made on a page.
 *
 * Only wraps the four tab routes (overview/modules/quiz/learners) — the
 * module editor is a drill-down from Modules with its own breadcrumb-only
 * shell (see ModuleEditorShell), not these tabs.
 */
export function CourseDetailShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const course =
    DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0];

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
      count: course.modules_count,
    },
    {
      key: "quiz",
      label: "Quiz",
      href: (id) => `/academy/courses/${id}/quiz`,
      count: (() => {
        const quizModule = getQuizModuleForCourse(course.id, course.modules_count);
        return quizModule ? getQuizForModule(quizModule.id).length : 0;
      })(),
    },
    {
      key: "learners",
      label: "Learners",
      href: (id) => `/academy/courses/${id}/learners`,
      count: course.learners_count,
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
            {course.is_first_sale_path ? <Badge>First sale path</Badge> : null}
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
