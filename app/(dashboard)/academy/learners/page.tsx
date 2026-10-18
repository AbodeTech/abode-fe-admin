"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { GlobalLearners } from "@/features/courses";

export default function AcademyLearnersPage() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading learners…" />}>
      <GlobalLearners />
    </Suspense>
  );
}
