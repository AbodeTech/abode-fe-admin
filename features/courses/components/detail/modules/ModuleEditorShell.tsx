"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { DUMMY_COURSES } from "../../../dummy-data";
import { getModulesForCourse } from "../../../dummy-modules";

/**
 * Breadcrumb-only shell for the module editor — a drill-down from Modules,
 * not one of the four course tabs, so it deliberately doesn't render
 * CourseDetailShell's tab nav (matching the design: the editor's top bar
 * shows "Courses › Course › Module", not the Overview/Modules/Quiz/Learners
 * tabs).
 */
export function ModuleEditorShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string; moduleId: string }>();
  const course = DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0];
  const modules = getModulesForCourse(course.id, course.modules_count);
  const mod = modules.find((m) => m.id === params.moduleId) ?? modules[0];

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1200px] space-y-5 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/academy/courses" className="hover:text-primary">
          Courses
        </Link>
        <span>›</span>
        <Link href={`/academy/courses/${course.id}/modules`} className="truncate hover:text-primary">
          {course.title}
        </Link>
        <span>›</span>
        <span className="truncate font-medium text-foreground">{mod.title}</span>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
