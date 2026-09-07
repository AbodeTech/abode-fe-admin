"use client";

import { useParams } from "next/navigation";

import { CohortPlaceholderPage } from "@/features/recruitment";

export default function Page() {
  const { programmeId, cohortId } = useParams<{
    programmeId: string;
    cohortId: string;
  }>();
  return (
    <CohortPlaceholderPage
      programmeId={programmeId}
      cohortId={cohortId}
      title="Cohort settings"
      body="Event date, venue, city, date confirmed, open/close registration, and set as programme default (ABO-12)."
    />
  );
}
