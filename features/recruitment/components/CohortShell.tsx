'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { useCohort, useProgramme } from '../hooks/use-recruitment';

const TABS = [
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'registrants', label: 'Registrants' },
  { slug: 'referrals', label: 'Referrals' },
  { slug: 'sessions', label: 'Sessions' },
  { slug: 'tests', label: 'Tests' },
  { slug: 'settings', label: 'Settings' },
] as const;

export function CohortShell({
  programmeId,
  cohortId,
  children,
}: {
  programmeId: string;
  cohortId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: programme } = useProgramme(programmeId);
  const { data: cohort } = useCohort(cohortId);
  const base = `/recruitment/${programmeId}/cohorts/${cohortId}`;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <Link
          href={`/recruitment/${programmeId}`}
          className="text-xs text-slate-500 hover:underline"
        >
          ← {programme?.name ?? 'Programme'}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {cohort?.label ?? cohort?.name ?? 'Cohort'}
        </h1>
        {cohort?.register_url ? (
          <p className="mt-1 truncate text-xs text-slate-500">
            Register: {cohort.register_url}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-wrap gap-1 border-b pb-px">
        {TABS.map((tab) => {
          const href = `${base}/${tab.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                'rounded-t-md px-3 py-2 text-sm font-medium',
                active
                  ? 'border border-b-white border-slate-200 bg-white text-slate-900'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
