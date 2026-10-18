"use client";

import { useParams } from "next/navigation";

import { CohortTestsPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return <CohortTestsPage programmeId={programmeId} cohortId={cohortId} />;
}
