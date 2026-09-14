"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProgrammes, useProgrammesCohorts } from "@/features/recruitment";

import { useCreateMeeting, useUpdateMeeting } from "../hooks/use-meetings";
import {
  DEFAULT_DURATION_MINUTES,
  formatMeetingWhen,
  fromDatetimeLocalValue,
  isGoogleMeetUrl,
  MAX_DURATION_MINUTES,
  MEETING_ACCESS_TYPE_LABELS,
  MEETING_ACCESS_TYPES,
  MEETING_AUDIENCE_LABELS,
  MEETING_AUDIENCE_TYPES,
  MEETING_RECURRENCE_FREQUENCIES,
  MEETING_RECURRENCE_FREQUENCY_LABELS,
  MIN_DURATION_MINUTES,
  previewRecurrenceDates,
  toDatetimeLocalValue,
  type Meeting,
  type MeetingAccessType,
  type MeetingAudienceMode,
  type MeetingAudienceType,
  type MeetingRecurrenceFrequency,
} from "../schemas/meeting.schema";

type FormState = {
  name: string;
  google_meet_url: string;
  audience_mode: MeetingAudienceMode;
  audience_type: MeetingAudienceType;
  cohort_id: string;
  access_type: MeetingAccessType;
  venue: string;
  city: string;
  details_confirmed: boolean;
  starts_at: string;
  verification_lead_minutes: string;
  duration_minutes: string;
  recurrence_enabled: boolean;
  recurrence_frequency: MeetingRecurrenceFrequency;
  recurrence_count: string;
};

export type CreateMeetingPreset = {
  cohortId: string;
  cohortLabel?: string;
};

const emptyForm = (preset?: CreateMeetingPreset): FormState => ({
  name: "",
  google_meet_url: "",
  audience_mode: preset?.cohortId ? "cohort" : "tier",
  audience_type: "all_associates",
  cohort_id: preset?.cohortId ?? "",
  access_type: "online",
  venue: "",
  city: "",
  details_confirmed: false,
  starts_at: "",
  verification_lead_minutes: "30",
  duration_minutes: String(DEFAULT_DURATION_MINUTES),
  recurrence_enabled: false,
  recurrence_frequency: "daily",
  recurrence_count: "4",
});

function formFromMeeting(meeting: Meeting): FormState {
  return {
    name: meeting.name,
    google_meet_url: meeting.google_meet_url ?? "",
    audience_mode: meeting.cohort_id ? "cohort" : "tier",
    audience_type: meeting.audience_type ?? "all_associates",
    cohort_id: meeting.cohort_id ?? "",
    access_type: meeting.access_type ?? "online",
    venue: meeting.venue ?? "",
    city: meeting.city ?? "",
    details_confirmed: Boolean(meeting.details_confirmed),
    starts_at: toDatetimeLocalValue(meeting.starts_at),
    verification_lead_minutes: String(meeting.verification_lead_minutes),
    duration_minutes: String(meeting.duration_minutes ?? DEFAULT_DURATION_MINUTES),
    recurrence_enabled: false,
    recurrence_frequency: "daily",
    recurrence_count: "4",
  };
}

function MeetingFormFields({
  form,
  setForm,
  disabled,
  allowRecurrence,
  lockCohortAudience,
  lockedCohortLabel,
  showAccessTypeField = true,
}: {
  form: FormState;
  setForm: (next: FormState) => void;
  disabled: boolean;
  allowRecurrence: boolean;
  lockCohortAudience?: boolean;
  lockedCohortLabel?: string;
  /** DC-03 — the global, unscoped meeting dialog no longer asks Online/Physical. */
  showAccessTypeField?: boolean;
}) {
  const programmesQuery = useProgrammes({ page: 1, limit: 50 });
  const programmeIds = useMemo(
    () => (programmesQuery.data?.items ?? []).map((programme) => programme.id),
    [programmesQuery.data?.items],
  );
  // The list endpoint above never embeds each programme's `cohorts` — only the
  // per-programme detail endpoint does — so fetch those in parallel.
  const { programmes: programmesWithCohorts, isLoading: cohortsLoading } =
    useProgrammesCohorts(programmeIds);
  const cohortOptions = useMemo(() => {
    const fromProgrammes = programmesWithCohorts.flatMap((programme) =>
      (programme.cohorts ?? []).map((cohort) => ({
        id: cohort.id,
        label: cohort.label || `${programme.name} — ${cohort.name}`,
      })),
    );
    if (
      lockCohortAudience &&
      form.cohort_id &&
      !fromProgrammes.some((c) => c.id === form.cohort_id)
    ) {
      return [
        {
          id: form.cohort_id,
          label: lockedCohortLabel || `Cohort ${form.cohort_id}`,
        },
        ...fromProgrammes,
      ];
    }
    return fromProgrammes;
  }, [
    programmesWithCohorts,
    lockCohortAudience,
    form.cohort_id,
    lockedCohortLabel,
  ]);

  const recurrenceCount = Math.max(1, Number(form.recurrence_count) || 1);
  const previewDates =
    allowRecurrence && form.recurrence_enabled && form.starts_at
      ? previewRecurrenceDates(form.starts_at, recurrenceCount, form.recurrence_frequency)
      : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="meeting-name">Name</Label>
        <Input
          id="meeting-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          disabled={disabled}
        />
      </div>

      {showAccessTypeField ? (
        <div className="space-y-2">
          <Label>Access type</Label>
          <Select
            value={form.access_type}
            onValueChange={(value) =>
              setForm({ ...form, access_type: value as MeetingAccessType })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_ACCESS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {MEETING_ACCESS_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {form.access_type === "online" ? (
        <div className="space-y-2">
          <Label htmlFor="meeting-url">Google Meet URL</Label>
          <Input
            id="meeting-url"
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={form.google_meet_url}
            onChange={(e) => setForm({ ...form, google_meet_url: e.target.value })}
            required
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-venue">Venue</Label>
            <Textarea
              id="meeting-venue"
              placeholder="Address or landmark"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              required
              disabled={disabled}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-city">City</Label>
            <Input
              id="meeting-city"
              placeholder="Lagos"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
              disabled={disabled}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="meeting-details-confirmed"
              checked={form.details_confirmed}
              onCheckedChange={(checked) => setForm({ ...form, details_confirmed: checked === true })}
              disabled={disabled}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor="meeting-details-confirmed" className="font-normal">
                Date confirmed
              </Label>
              <p className="text-xs text-muted-foreground">
                Registrants only get their check-in QR once this is checked.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Audience mode</Label>
          <Select
            value={form.audience_mode}
            onValueChange={(value) =>
              setForm({ ...form, audience_mode: value as MeetingAudienceMode })
            }
            disabled={disabled || lockCohortAudience}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tier">Associate tier</SelectItem>
              <SelectItem value="cohort">Recruitment cohort</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.audience_mode === "tier" ? (
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select
              value={form.audience_type}
              onValueChange={(value) =>
                setForm({ ...form, audience_type: value as MeetingAudienceType })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_AUDIENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MEETING_AUDIENCE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Cohort</Label>
            {lockCohortAudience ? (
              <Input
                value={lockedCohortLabel || form.cohort_id}
                disabled
                readOnly
              />
            ) : (
              <Select
                value={form.cohort_id || undefined}
                onValueChange={(value) => setForm({ ...form, cohort_id: value })}
                disabled={disabled || programmesQuery.isLoading || cohortsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohortOptions.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No cohorts available
                    </SelectItem>
                  ) : (
                    cohortOptions.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting-lead">Verification lead (minutes)</Label>
          <Input
            id="meeting-lead"
            type="number"
            min={0}
            max={720}
            value={form.verification_lead_minutes}
            onChange={(e) => setForm({ ...form, verification_lead_minutes: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting-duration">Duration (minutes)</Label>
          <Input
            id="meeting-duration"
            type="number"
            min={MIN_DURATION_MINUTES}
            max={MAX_DURATION_MINUTES}
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-starts">
          {allowRecurrence && form.recurrence_enabled ? "First session starts at" : "Starts at"}
        </Label>
        <Input
          id="meeting-starts"
          type="datetime-local"
          value={form.starts_at}
          onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          required
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">Sent as UTC ISO. Shown in WAT on lists.</p>
      </div>

      {allowRecurrence ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Repeat series</p>
              <p className="text-xs text-muted-foreground">
                Create multiple sessions from the first start date.
              </p>
            </div>
            <Select
              value={form.recurrence_enabled ? "yes" : "no"}
              onValueChange={(value) =>
                setForm({ ...form, recurrence_enabled: value === "yes" })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.recurrence_enabled ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={form.recurrence_frequency}
                    onValueChange={(value) =>
                      setForm({ ...form, recurrence_frequency: value as MeetingRecurrenceFrequency })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_RECURRENCE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {MEETING_RECURRENCE_FREQUENCY_LABELS[freq]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-recurrence-count">Number of sessions</Label>
                  <Input
                    id="meeting-recurrence-count"
                    type="number"
                    min={2}
                    max={60}
                    value={form.recurrence_count}
                    onChange={(e) => setForm({ ...form, recurrence_count: e.target.value })}
                    disabled={disabled}
                  />
                </div>
              </div>
              {previewDates.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Preview ({previewDates.length})
                  </p>
                  <ul className="max-h-36 space-y-1 overflow-y-auto text-sm">
                    {previewDates.map((iso, idx) => (
                      <li key={iso} className="flex justify-between gap-2 tabular-nums">
                        <span className="text-muted-foreground">Session {idx + 1}</span>
                        <span>{formatMeetingWhen(iso)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pick a start time to preview session dates.
                </p>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function validateForm(form: FormState, opts?: { allowRecurrence?: boolean }): string | null {
  if (!form.name.trim()) return "Name is required";
  if (form.access_type === "online" && !isGoogleMeetUrl(form.google_meet_url)) {
    return "Google Meet URL must start with https://meet.google.com/";
  }
  if (form.access_type === "physical" && !form.venue.trim()) {
    return "Venue is required for physical sessions";
  }
  if (form.access_type === "physical" && !form.city.trim()) {
    return "City is required for physical sessions";
  }
  if (form.audience_mode === "cohort" && !form.cohort_id.trim()) {
    return "Select a cohort audience";
  }
  if (!form.starts_at) return "Start time is required";
  const lead = Number(form.verification_lead_minutes);
  if (Number.isNaN(lead) || lead < 0 || lead > 720) {
    return "Verification lead must be between 0 and 720 minutes";
  }
  const duration = Number(form.duration_minutes);
  if (
    Number.isNaN(duration) ||
    !Number.isInteger(duration) ||
    duration < MIN_DURATION_MINUTES ||
    duration > MAX_DURATION_MINUTES
  ) {
    return `Duration must be a whole number between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`;
  }
  if (opts?.allowRecurrence && form.recurrence_enabled) {
    const count = Number(form.recurrence_count);
    if (!Number.isInteger(count) || count < 2 || count > 60) {
      return "Series must include between 2 and 60 sessions";
    }
  }
  return null;
}

function toCreatePayload(form: FormState) {
  const recurrenceCount = Number(form.recurrence_count);
  return {
    name: form.name.trim(),
    google_meet_url:
      form.access_type === "online" ? form.google_meet_url.trim() : form.google_meet_url.trim() || undefined,
    audience_type: form.audience_mode === "tier" ? form.audience_type : undefined,
    audience_mode: form.audience_mode,
    cohort_id: form.audience_mode === "cohort" ? form.cohort_id : undefined,
    access_type: form.access_type,
    venue: form.access_type === "physical" ? form.venue.trim() : undefined,
    city: form.access_type === "physical" ? form.city.trim() : undefined,
    details_confirmed: form.access_type === "physical" ? form.details_confirmed : undefined,
    starts_at: fromDatetimeLocalValue(form.starts_at),
    verification_lead_minutes: Number(form.verification_lead_minutes),
    duration_minutes: Number(form.duration_minutes),
    recurrence:
      form.recurrence_enabled && recurrenceCount > 1
        ? { frequency: form.recurrence_frequency, count: recurrenceCount }
        : undefined,
  };
}

export function CreateMeetingDialog({
  preset,
  triggerLabel,
  onCreated,
}: {
  preset?: CreateMeetingPreset;
  triggerLabel?: string;
  onCreated?: (meeting: Meeting) => void;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(preset));
  const { mutateAsync, isPending } = useCreateMeeting();
  const lockedToCohort = Boolean(preset?.cohortId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm(form, { allowRecurrence: true });
    if (error) {
      toast.error(error);
      return;
    }
    try {
      const meeting = await mutateAsync(toCreatePayload(form));
      toast.success(
        meeting.series_id
          ? `Series created (${meeting.series_total} sessions)`
          : lockedToCohort
            ? "Session created"
            : "Meeting created",
      );
      setOpen(false);
      setForm(emptyForm(preset));
      onCreated?.(meeting);
      // No series-detail route on the real BE (no series controller at all —
      // see docs/ACADEMY-BACKEND-GAPS.md §2), so there's nowhere useful to
      // send a series's first session. Cohort-scoped creation already stays
      // on the Sessions tab via `onCreated`'s refetch; the unscoped dialog
      // lives on /meetings itself, so just land back on the list.
      if (!lockedToCohort) {
        router.push("/meetings");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create meeting");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setForm(emptyForm(preset));
        else setForm(emptyForm(preset));
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel ?? (lockedToCohort ? "Create session" : "Create meeting")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>
            {lockedToCohort ? "Create cohort session" : "Create meeting"}
          </DialogTitle>
          <DialogDescription>
            {lockedToCohort
              ? "Audience is locked to this cohort. Choose online or physical, optional series."
              : "Tier audience, optional series with preview. For a physical day, add it from inside a cohort's Sessions tab."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <MeetingFormFields
            form={form}
            setForm={setForm}
            disabled={isPending}
            allowRecurrence
            lockCohortAudience={lockedToCohort}
            lockedCohortLabel={preset?.cohortLabel}
            showAccessTypeField={lockedToCohort}
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.recurrence_enabled ? "Create series" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditMeetingDialog({
  meeting,
  open,
  onOpenChange,
}: {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFromMeeting(meeting));
  const { mutateAsync, isPending } = useUpdateMeeting();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      const payload = toCreatePayload(form);
      await mutateAsync({
        id: meeting.id,
        name: payload.name,
        google_meet_url: payload.google_meet_url,
        audience_type: payload.audience_type,
        starts_at: payload.starts_at,
        verification_lead_minutes: payload.verification_lead_minutes,
        duration_minutes: payload.duration_minutes,
        access_type: payload.access_type,
        venue: payload.venue,
        city: payload.city,
        details_confirmed: payload.details_confirmed,
        cohort_id: payload.cohort_id,
      });
      toast.success("Meeting updated");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update meeting");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setForm(formFromMeeting(meeting));
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>Slug and share URL stay the same when you rename a meeting.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <MeetingFormFields
            form={form}
            setForm={setForm}
            disabled={isPending}
            allowRecurrence={false}
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
