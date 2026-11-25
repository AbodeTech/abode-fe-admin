import { Suspense } from 'react';

import { RecruitmentAnalysisPage } from '@/features/recruitment';
import { PageContentLoader } from '@/components/shared/page-content-loader';

export default function RecruitmentComparisonRoute() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading cohort comparison…" />}>
      <RecruitmentAnalysisPage mode="compare" />
    </Suspense>
  );
}
