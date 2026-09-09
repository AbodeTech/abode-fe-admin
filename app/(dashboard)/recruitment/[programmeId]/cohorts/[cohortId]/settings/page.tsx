"use client";

import { useParams } from "next/navigation";

import { CohortSettingsPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return <CohortSettingsPage programmeId={programmeId} cohortId={cohortId} />;
}
