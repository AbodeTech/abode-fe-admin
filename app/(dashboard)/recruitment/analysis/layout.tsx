'use client';

import type { ReactNode } from 'react';

import { useHasPermission } from '@/hooks/use-admin-permission';
import { useAuthStore } from '@/store/auth-store';
import { PageContentLoader } from '@/components/shared/page-content-loader';

export default function RecruitmentAnalysisLayout({ children }: { children: ReactNode }) {
  const admin = useAuthStore((state) => state.user);
  const allowed = useHasPermission('view_recruitment_analysis');

  if (!admin) return <PageContentLoader label="Checking access…" />;

  if (!allowed) {
    return (
      <section className="rounded-lg border bg-white p-6">
        <h1 className="text-lg font-semibold">Recruitment Analysis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don’t have permission to view recruitment analysis.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
