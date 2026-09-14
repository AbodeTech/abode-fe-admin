"use client";

import { useParams } from "next/navigation";

import { ProgrammeDetailPage } from "@/features/recruitment";

export default function RecruitmentProgrammePage() {
  const { programmeId } = useParams<{ programmeId: string }>();
  return <ProgrammeDetailPage programmeId={programmeId} />;
}
