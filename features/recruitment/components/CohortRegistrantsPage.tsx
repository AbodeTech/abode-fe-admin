'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/shared/Pagination';
import { useAdminPermissions } from '@/hooks/use-admin-permission';
import { useDebounce } from '@/hooks/use-debounce';

import {
  DEFAULT_REGISTRANTS_LIMIT,
  useCohortRegistrants,
  useDeleteRegistrant,
  useExportRegistrants,
  usePatchRegistrant,
} from '../hooks/use-recruitment';
import type { Registrant, UpdateRegistrantInput } from '../schemas/programme.schema';
import { CohortShell } from './CohortShell';

function EditRegistrantDialog({
  registrant,
  cohortId,
  open,
  onOpenChange,
}: {
  registrant: Registrant;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const patch = usePatchRegistrant(cohortId);
  const [form, setForm] = useState<UpdateRegistrantInput>({});
  // Adjusting state during render (not an effect) so opening the dialog for a
  // different registrant re-syncs the form without an extra commit.
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  if (open && syncedFor !== registrant.id) {
    setSyncedFor(registrant.id);
    setForm({
      first_name: registrant.first_name,
      last_name: registrant.last_name,
      phone: registrant.phone ?? '',
      region: registrant.region ?? '',
      status: registrant.status ?? '',
      checked_in: registrant.checked_in,
    });
  } else if (!open && syncedFor !== null) {
    setSyncedFor(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await patch.mutateAsync({ registrantId: registrant.id, patch: form });
      toast.success('Registrant updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit registrant</DialogTitle>
          <DialogDescription>
            Only profile fields and check-in status — identity (email) can&apos;t change here.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSave}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="reg-first">First name</Label>
              <Input
                id="reg-first"
                value={form.first_name ?? ''}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-last">Last name</Label>
              <Input
                id="reg-last"
                value={form.last_name ?? ''}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-phone">Phone</Label>
            <Input
              id="reg-phone"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-region">Region</Label>
            <Input
              id="reg-region"
              value={form.region ?? ''}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg-status">Status</Label>
            <Input
              id="reg-status"
              value={form.status ?? ''}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(form.checked_in)}
              onCheckedChange={(v) => setForm({ ...form, checked_in: v === true })}
            />
            Checked in
          </label>
          <DialogFooter>
            <Button type="submit" disabled={patch.isPending}>
              {patch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRegistrantDialog({
  registrant,
  cohortId,
  open,
  onOpenChange,
}: {
  registrant: Registrant;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const del = useDeleteRegistrant(cohortId);
  const [reason, setReason] = useState('');

  async function onDelete() {
    if (!reason.trim()) {
      toast.error('A reason is required');
      return;
    }
    try {
      await del.mutateAsync({ registrantId: registrant.id, reason: reason.trim() });
      toast.success('Registrant removed');
      onOpenChange(false);
      setReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove registrant</DialogTitle>
          <DialogDescription>
            Removes {registrant.first_name} {registrant.last_name} from this cohort (soft delete —
            reversible on the backend, not from here).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="del-reason">Reason</Label>
          <Textarea
            id="del-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={del.isPending}>
            {del.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CohortRegistrantsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissions = useAdminPermissions();
  const canManage = permissions.has('manage_academy');
  const canExport = permissions.has('export_academy');

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('q') || '';
  const region = searchParams.get('region') || '';
  const wasExistingParam = searchParams.get('was_existing');
  const checkedInParam = searchParams.get('checked_in');
  const debouncedSearch = useDebounce(search);
  const debouncedRegion = useDebounce(region);

  const filters = {
    search: debouncedSearch || undefined,
    region: debouncedRegion || undefined,
    was_existing: wasExistingParam === null ? undefined : wasExistingParam === 'true',
    checked_in: checkedInParam === null ? undefined : checkedInParam === 'true',
  };

  const { data, isLoading, error } = useCohortRegistrants(cohortId, { page, ...filters });
  const exportRegistrants = useExportRegistrants(cohortId);
  const rows = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  const [editing, setEditing] = useState<Registrant | null>(null);
  const [deleting, setDeleting] = useState<Registrant | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function onExport() {
    try {
      await exportRegistrants.mutateAsync(filters);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{total} registrant{total === 1 ? '' : 's'}</p>
          {canExport ? (
            <Button variant="outline" size="sm" onClick={onExport} disabled={exportRegistrants.isPending}>
              {exportRegistrants.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setParam('q', e.target.value || null)}
            className="sm:max-w-xs"
          />
          <Input
            placeholder="Region"
            value={region}
            onChange={(e) => setParam('region', e.target.value || null)}
            className="sm:max-w-40"
          />
          <Select
            value={wasExistingParam ?? 'all'}
            onValueChange={(v) => setParam('was_existing', v === 'all' ? null : v)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="New / returning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">New & returning</SelectItem>
              <SelectItem value="false">New only</SelectItem>
              <SelectItem value="true">Returning only</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={checkedInParam ?? 'all'}
            onValueChange={(v) => setParam('checked_in', v === 'all' ? null : v)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Check-in" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All check-in</SelectItem>
              <SelectItem value="true">Checked in</SelectItem>
              <SelectItem value="false">Not checked in</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error.message}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Region</th>
                <th className="px-3 py-2">New/returning</th>
                <th className="px-3 py-2">Referral</th>
                <th className="px-3 py-2">Check-in</th>
                {canManage ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                    No registrants
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.email}</td>
                    <td className="px-3 py-2 text-slate-600">{r.region || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {r.was_existing ? 'Returning' : 'New'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {r.referred_by_username
                        ? `@${r.referred_by_username}`
                        : r.referral_source || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {r.checked_in ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    {canManage ? (
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleting(r)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination count={total} currentIdx={page} limit={DEFAULT_REGISTRANTS_LIMIT} />

      {editing ? (
        <EditRegistrantDialog
          registrant={editing}
          cohortId={cohortId}
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <DeleteRegistrantDialog
          registrant={deleting}
          cohortId={cohortId}
          open={Boolean(deleting)}
          onOpenChange={(open) => !open && setDeleting(null)}
        />
      ) : null}
    </CohortShell>
  );
}
