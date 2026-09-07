'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import {
  useCreateCohort,
  useProgramme,
  useToggleProgrammeActive,
} from '../hooks/use-recruitment';
import { PROGRAMME_TYPE_LABELS } from '../schemas/programme.schema';

export function ProgrammeDetailPage({ programmeId }: { programmeId: string }) {
  const router = useRouter();
  const canManage = useAdminPermissions().has('manage_academy');
  const { data: programme, isLoading, error } = useProgramme(programmeId);
  const toggle = useToggleProgrammeActive();
  const createCohort = useCreateCohort(programmeId);

  const [showNewCohort, setShowNewCohort] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [goal, setGoal] = useState('5000');

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading programme…</div>;
  }
  if (error || !programme) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error?.message || 'Programme not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/recruitment" className="text-xs text-slate-500 hover:underline">
            ← Recruitment
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{programme.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {PROGRAMME_TYPE_LABELS[programme.type]}
            {programme.description ? ` · ${programme.description}` : ''}
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={toggle.isPending}
              onClick={() =>
                toggle.mutate(
                  { id: programme.id, is_active: !programme.is_active },
                  {
                    onSuccess: () =>
                      toast.success(programme.is_active ? 'Programme paused' : 'Programme resumed'),
                    onError: (err) => toast.error(err.message),
                  },
                )
              }
            >
              {programme.is_active ? 'Pause' : 'Resume'}
            </Button>
            <Button onClick={() => setShowNewCohort((v) => !v)}>New cohort</Button>
          </div>
        ) : null}
      </div>

      {showNewCohort && canManage ? (
        <form
          className="space-y-3 rounded-xl border bg-white p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const cohort = await createCohort.mutateAsync({
                name: cohortName,
                registration_goal: Number(goal) || 5000,
                set_as_default: false,
              });
              toast.success('Cohort created');
              setShowNewCohort(false);
              setCohortName('');
              router.push(`/recruitment/${programmeId}/cohorts/${cohort.id}/dashboard`);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed');
            }
          }}
        >
          <h2 className="text-sm font-semibold">Add cohort</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cn">Name</Label>
              <Input
                id="cn"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cg">Goal</Label>
              <Input
                id="cg"
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={createCohort.isPending}>
            Create cohort
          </Button>
        </form>
      ) : null}

      <div className="grid gap-3">
        {programme.cohorts?.map((cohort) => (
          <Link
            key={cohort.id}
            href={`/recruitment/${programmeId}/cohorts/${cohort.id}/dashboard`}
            className="rounded-xl border bg-white p-4 transition hover:border-slate-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-900">
                  {cohort.name}
                  {cohort.is_default ? (
                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                      Default
                    </span>
                  ) : null}
                  {!cohort.registration_open ? (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      Registration closed
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  Goal {cohort.registration_goal.toLocaleString()} ·{' '}
                  {cohort.registrant_count} registrants
                </p>
              </div>
              <span className="text-sm text-slate-400">Open dashboard →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
