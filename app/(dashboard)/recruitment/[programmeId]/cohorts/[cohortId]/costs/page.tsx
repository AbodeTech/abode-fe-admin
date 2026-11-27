'use client';

import { useParams } from 'next/navigation';
import { CohortCostsPage } from '@/features/recruitment/components/CohortCostsPage';

export default function Page() {
  const { programmeId, cohortId } = useParams<{ programmeId: string; cohortId: string }>();
  return <CohortCostsPage programmeId={programmeId} cohortId={cohortId} />;
}
