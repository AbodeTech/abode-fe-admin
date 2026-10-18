"use client";

import { useParams } from "next/navigation";

import { CohortSessionsPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return <CohortSessionsPage programmeId={programmeId} cohortId={cohortId} />;
}
