"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { RecruitmentAnalysisPage } from "@/features/recruitment";

export default function RecruitmentAnalysisRoute() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading recruitment analysis…" />}>
      <RecruitmentAnalysisPage />
    </Suspense>
  );
}
