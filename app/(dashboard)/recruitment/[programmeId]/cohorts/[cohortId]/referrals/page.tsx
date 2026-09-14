"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { CohortReferralsPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return (
    <Suspense fallback={<PageContentLoader label="Loading referrals…" />}>
      <CohortReferralsPage programmeId={programmeId} cohortId={cohortId} />
    </Suspense>
  );
}
