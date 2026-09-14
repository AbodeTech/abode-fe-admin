"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { CourseDetailShell, CourseLearners } from "@/features/courses";

export default function CourseLearnersPage() {
  return (
    <CourseDetailShell>
      <Suspense fallback={<PageContentLoader label="Loading learners…" />}>
        <CourseLearners />
      </Suspense>
    </CourseDetailShell>
  );
}
