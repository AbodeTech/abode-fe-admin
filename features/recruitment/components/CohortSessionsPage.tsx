'use client';

import { useState } from 'react';

import { useHasPermission } from '@/hooks/use-admin-permission';
import {
  CreateMeetingDialog,
  DEFAULT_MEETINGS_LIMIT,
  MeetingsTable,
  useMeetings,
} from '@/features/meetings';

import { useCohort } from '../hooks/use-recruitment';
import { CohortShell } from './CohortShell';

export function CohortSessionsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const [page, setPage] = useState(1);
  const canManage = useHasPermission('manage_meetings');
  const { data: cohort } = useCohort(cohortId);
  const { data, isLoading, error, refetch } = useMeetings({
    page,
    limit: DEFAULT_MEETINGS_LIMIT,
    cohort_id: cohortId,
  });

  const count = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / DEFAULT_MEETINGS_LIMIT));

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Sessions</h2>
            <p className="text-sm text-slate-500">
              Online and physical sessions for this cohort. Create with the cohort audience
              preselected.
            </p>
          </div>
          {canManage ? (
            <CreateMeetingDialog
              preset={{
                cohortId,
                cohortLabel: cohort?.label ?? cohort?.name,
                sessionKind: 'recruitment',
              }}
              triggerLabel="Create session"
              onCreated={() => {
                setPage(1);
                void refetch();
              }}
            />
          ) : null}
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
            <p className="font-medium">Could not load sessions</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : (
          <>
            <MeetingsTable rows={data?.items ?? []} isLoading={isLoading} />
            {count > DEFAULT_MEETINGS_LIMIT ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </CohortShell>
  );
}
