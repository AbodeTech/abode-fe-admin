"use client";

import { useParams } from "next/navigation";

import { CohortDashboardPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return <CohortDashboardPage programmeId={programmeId} cohortId={cohortId} />;
}
