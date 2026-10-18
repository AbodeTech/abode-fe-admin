"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { ProgrammesListPage } from "@/features/recruitment";

export default function RecruitmentPage() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading recruitment…" />}>
      <ProgrammesListPage />
    </Suspense>
  );
}
