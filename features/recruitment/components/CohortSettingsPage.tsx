'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyableText } from '@/components/shared/CopyableText';
import { useAdminPermissions } from '@/hooks/use-admin-permission';

import {
  useCohort,
  usePatchCohort,
  useSetDefaultCohort,
  useToggleCohortRegistration,
} from '../hooks/use-recruitment';
import { CohortShell } from './CohortShell';

/**
 * DC-04 — the cohort's own facts only: name/label, registration goal and
 * window, whether registration is open, and default-intake. Event date,
 * venue, city and details_confirmed live on the physical session (Sessions
 * tab) since DC-02 — not here.
 */
export function CohortSettingsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const canManage = useAdminPermissions().has('manage_academy');
  const { data: cohort, isLoading, error } = useCohort(cohortId);
  const patch = usePatchCohort(cohortId);
  const toggleRegistration = useToggleCohortRegistration(cohortId);
  const setDefault = useSetDefaultCohort(cohortId);

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [goal, setGoal] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(true);

  // Populate the form once the cohort loads (React's "adjusting state during
  // render" pattern — not an effect, so it doesn't cost an extra commit and
  // won't clobber in-progress edits on refetch after save).
  const [syncedCohortId, setSyncedCohortId] = useState<string | null>(null);
  if (cohort && cohort.id !== syncedCohortId) {
    setSyncedCohortId(cohort.id);
    setName(cohort.name);
    setLabel(cohort.label);
    setGoal(String(cohort.registration_goal));
    setOpensAt(cohort.registration_opens ? cohort.registration_opens.slice(0, 10) : '');
    setClosesAt(cohort.registration_closes ? cohort.registration_closes.slice(0, 10) : '');
    setRegistrationOpen(cohort.registration_open);
  }

  // Three real endpoints, not one PATCH: core fields, the open/close switch,
  // and the default swap are each their own atomic write on the BE.
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const writes: Promise<unknown>[] = [
        patch.mutateAsync({
          name,
          label,
          registration_goal: Number(goal) || undefined,
          registration_opens: opensAt ? new Date(opensAt).toISOString() : null,
          registration_closes: closesAt ? new Date(closesAt).toISOString() : null,
        }),
      ];
      if (cohort && registrationOpen !== cohort.registration_open) {
        writes.push(toggleRegistration.mutateAsync(registrationOpen));
      }
      await Promise.all(writes);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function onSetDefault() {
    try {
      await setDefault.mutateAsync();
      toast.success('Default intake updated — the previous default was cleared');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  const saving = patch.isPending || toggleRegistration.isPending;

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error.message}
        </div>
      ) : isLoading || !cohort ? (
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <div className="space-y-4">
          <form
            onSubmit={onSave}
            className="space-y-4 rounded-xl border bg-white p-4 md:p-6"
          >
            <h2 className="text-sm font-semibold text-slate-900">Cohort</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cs-name">Name</Label>
                <Input
                  id="cs-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManage}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-label">Label (shown to public)</Label>
                <Input
                  id="cs-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={!canManage}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-goal">Registration goal</Label>
                <Input
                  id="cs-goal"
                  type="number"
                  min={1}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <div />
              <div className="space-y-1.5">
                <Label htmlFor="cs-opens">Registration opens</Label>
                <Input
                  id="cs-opens"
                  type="date"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cs-closes">Registration closes</Label>
                <Input
                  id="cs-closes"
                  type="date"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  disabled={!canManage}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-900">
              <Checkbox
                checked={registrationOpen}
                onCheckedChange={(v) => setRegistrationOpen(Boolean(v))}
                disabled={!canManage}
              />
              Registration open
              <span className="text-xs font-normal text-slate-500">
                — off shows &quot;Registration is currently closed&quot; on the public page,
                regardless of the dates above
              </span>
            </label>

            {canManage ? (
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            ) : null}
          </form>

          <div className="space-y-4 rounded-xl border bg-white p-4 md:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Default intake</h2>
            <p className="text-sm text-slate-500">
              Whether the bare <code>/register</code> link lands on this cohort. Turning it on
              clears the previous default atomically.
            </p>
            <div className="flex items-center gap-3">
              {cohort.is_default ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  This is the default intake
                </span>
              ) : canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={setDefault.isPending}
                  onClick={onSetDefault}
                >
                  Make default intake
                </Button>
              ) : (
                <span className="text-sm text-slate-500">Not the default intake</span>
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border bg-white p-4 md:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Public link</h2>
            <p className="text-sm text-slate-500">
              {cohort.is_default
                ? 'This cohort is already the default — the bare /register link lands here.'
                : 'Use this link to send registrants to this cohort specifically.'}
            </p>
            {cohort.register_url ? (
              <CopyableText
                text={cohort.register_url}
                className="rounded-md border bg-slate-50 px-3 py-2 text-sm"
              />
            ) : (
              <p className="text-sm text-slate-400">No public link yet</p>
            )}
          </div>
        </div>
      )}
    </CohortShell>
  );
}
