'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import { useCreateProgramme } from '../hooks/use-recruitment';
import {
  PROGRAMME_TYPES,
  PROGRAMME_TYPE_LABELS,
  type ProgrammeType,
} from '../schemas/programme.schema';

export function ProgrammeCreatePage() {
  const router = useRouter();
  const canManage = useAdminPermissions().has('manage_academy');
  const create = useCreateProgramme();

  const [name, setName] = useState('');
  const [type, setType] = useState<ProgrammeType>('rcp');
  const [description, setDescription] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [goal, setGoal] = useState('5000');
  const [eventDate, setEventDate] = useState('');
  const [eventCity, setEventCity] = useState('');
  const [eventVenue, setEventVenue] = useState('');

  if (!canManage) {
    return (
      <div className="p-6 text-sm text-slate-500">
        You need <code>manage_academy</code> to create programmes.
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const programme = await create.mutateAsync({
        name,
        type,
        description: description || undefined,
        cohort: {
          name: cohortName,
          registration_goal: Number(goal) || 5000,
          event_date: eventDate ? new Date(eventDate).toISOString() : undefined,
          event_city: eventCity || undefined,
          event_venue: eventVenue || undefined,
          set_as_default: true,
        },
      });
      toast.success('Programme created');
      const cohortId = programme.cohorts?.[0]?.id ?? programme.latest_cohort?.id;
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
            <div className="space-y-2 md:col-span-2 xl:col-span-2">
              <Label htmlFor="name">Programme name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Realtor Certification Program"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as ProgrammeType)}
              >
                {PROGRAMME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROGRAMME_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
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
              <Label htmlFor="eventDate">Event date</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventCity">Event city</Label>
              <Input
                id="eventCity"
                value={eventCity}
                onChange={(e) => setEventCity(e.target.value)}
                placeholder="Lagos"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label htmlFor="eventVenue">Event venue</Label>
              <Input
                id="eventVenue"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="TBA"
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
