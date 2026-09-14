'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import { useCreateProgramme } from '../hooks/use-recruitment';
import { ScheduleBuilder, type ScheduleBuilderValue } from './ScheduleBuilder';

export function ProgrammeCreatePage() {
  const router = useRouter();
  const canManage = useAdminPermissions().has('manage_academy');
  const create = useCreateProgramme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [goal, setGoal] = useState('5000');
  const [regOpens, setRegOpens] = useState('');
  const [regCloses, setRegCloses] = useState('');
  const [scheduleValue, setScheduleValue] = useState<ScheduleBuilderValue | null>(null);

  if (!canManage) {
    return (
      <div className="p-6 text-sm text-slate-500">
        You need <code>manage_academy</code> to create programmes.
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleValue?.isValid) {
      toast.error('Add at least one online day or a physical day for the schedule');
      return;
    }
    try {
      const programme = await create.mutateAsync({
        name,
        description: description || undefined,
        cohort: {
          name: cohortName,
          registration_goal: Number(goal) || 5000,
          registration_opens: regOpens ? new Date(regOpens).toISOString() : undefined,
          registration_closes: regCloses ? new Date(regCloses).toISOString() : undefined,
          set_as_default: true,
          schedule: scheduleValue.schedule,
        },
      });
      toast.success('Programme created');
      const cohortId = programme.cohorts?.[0]?.id ?? programme.default_cohort?.id;
      if (cohortId) {
        router.push(`/recruitment/${programme.id}/cohorts/${cohortId}/dashboard`);
      } else {
        router.push(`/recruitment/${programme.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    }
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">New programme</h1>
          <p className="mt-1 text-sm text-slate-500">
            Creates the programme and its first cohort in one step (mock until BE ABO-33+).
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" form="programme-create-form" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create programme'}
          </Button>
        </div>
      </div>

      <form
        id="programme-create-form"
        onSubmit={onSubmit}
        className="w-full space-y-8 rounded-xl border bg-white p-5 md:p-8"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Programme</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label htmlFor="name">Programme name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Realtor Certification Program"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">First cohort</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              This is the live dashboard + registration surface.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 md:col-span-2 xl:col-span-2">
              <Label htmlFor="cohortName">Cohort name</Label>
              <Input
                id="cohortName"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                placeholder="September 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Registration goal</Label>
              <Input
                id="goal"
                type="number"
                min={1}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regOpens">Registration opens</Label>
              <Input
                id="regOpens"
                type="date"
                value={regOpens}
                onChange={(e) => setRegOpens(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regCloses">Registration closes</Label>
              <Input
                id="regCloses"
                type="date"
                value={regCloses}
                onChange={(e) => setRegCloses(e.target.value)}
              />
            </div>
          </div>

          <ScheduleBuilder onChange={setScheduleValue} disabled={create.isPending} />
        </section>
      </form>
    </div>
  );
}
