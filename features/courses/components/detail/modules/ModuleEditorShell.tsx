"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useCourseDetail } from "../../../hooks/use-course-detail";
import { useModules } from "../../../hooks/use-modules";

/**
 * Breadcrumb-only shell for the module editor — a drill-down from Modules,
 * not one of the four course tabs, so it deliberately doesn't render
 * CourseDetailShell's tab nav (matching the design: the editor's top bar
 * shows "Courses › Course › Module", not the Overview/Modules/Quiz/Learners
 * tabs).
 */
export function ModuleEditorShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string; moduleId: string }>();
  const { data: course, isLoading: loadingCourse } = useCourseDetail(params.id);
  const { data: modules, isLoading: loadingModules } = useModules(params.id);

  if (loadingCourse || loadingModules) return <PageContentLoader label="Loading…" />;

  const mod = modules?.find((m) => m.id === params.moduleId);

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1200px] space-y-3 px-3 pb-16 sm:px-4 sm:pb-20">
      <Link
        href={`/academy/courses/${params.id}/modules`}
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to modules
      </Link>

      <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/academy/courses" className="hover:text-primary">
          Courses
        </Link>
        <span>›</span>
        <Link href={`/academy/courses/${params.id}/modules`} className="truncate hover:text-primary">
          {course?.title ?? "Course"}
        </Link>
        <span>›</span>
        <span className="truncate font-medium text-foreground">{mod?.title ?? "Module"}</span>
      </div>

      <div className="min-w-0 pt-2">{children}</div>
    </div>
  );
}
