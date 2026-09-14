"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { CohortRegistrantsPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return (
    <Suspense fallback={<PageContentLoader label="Loading registrants…" />}>
      <CohortRegistrantsPage programmeId={programmeId} cohortId={cohortId} />
    </Suspense>
  );
}
