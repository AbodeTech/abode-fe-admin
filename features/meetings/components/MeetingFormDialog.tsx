"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { useProgrammes } from "@/features/recruitment";

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
  MEETING_SESSION_KIND_LABELS,
  MEETING_SESSION_KINDS,
  MIN_DURATION_MINUTES,
  previewRecurrenceDates,
  toDatetimeLocalValue,
  type Meeting,
  type MeetingAccessType,
  type MeetingAudienceMode,
  type MeetingAudienceType,
  type MeetingSessionKind,
} from "../schemas/meeting.schema";

type FormState = {
  name: string;
  google_meet_url: string;
  audience_mode: MeetingAudienceMode;
  audience_type: MeetingAudienceType;
  cohort_id: string;
  session_kind: MeetingSessionKind;
  access_type: MeetingAccessType;
  venue: string;
  starts_at: string;
  verification_lead_minutes: string;
  duration_minutes: string;
  recurrence_enabled: boolean;
  recurrence_count: string;
};

export type CreateMeetingPreset = {
  cohortId: string;
  cohortLabel?: string;
  sessionKind?: MeetingSessionKind;
};

const emptyForm = (preset?: CreateMeetingPreset): FormState => ({
  name: "",
  google_meet_url: "",
  audience_mode: preset?.cohortId ? "cohort" : "tier",
  audience_type: "all_associates",
  cohort_id: preset?.cohortId ?? "",
  session_kind: preset?.sessionKind ?? (preset?.cohortId ? "recruitment" : "general"),
  access_type: "online",
  venue: "",
  starts_at: "",
  verification_lead_minutes: "30",
  duration_minutes: String(DEFAULT_DURATION_MINUTES),
  recurrence_enabled: false,
  recurrence_count: "4",
});

function formFromMeeting(meeting: Meeting): FormState {
  return {
    name: meeting.name,
    google_meet_url: meeting.google_meet_url,
    audience_mode: meeting.cohort_id ? "cohort" : "tier",
    audience_type: meeting.audience_type,
    cohort_id: meeting.cohort_id ?? "",
    session_kind: meeting.session_kind ?? "general",
    access_type: meeting.access_type ?? "online",
    venue: meeting.venue ?? "",
    starts_at: toDatetimeLocalValue(meeting.starts_at),
    verification_lead_minutes: String(meeting.verification_lead_minutes),
    duration_minutes: String(meeting.duration_minutes ?? DEFAULT_DURATION_MINUTES),
    recurrence_enabled: false,
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
}: {
  form: FormState;
  setForm: (next: FormState) => void;
  disabled: boolean;
  allowRecurrence: boolean;
  lockCohortAudience?: boolean;
  lockedCohortLabel?: string;
}) {
  const programmesQuery = useProgrammes({ page: 1, limit: 50 });
  const cohortOptions = useMemo(() => {
    const items = programmesQuery.data?.items ?? [];
    const fromProgrammes = items.flatMap((programme) =>
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
    programmesQuery.data?.items,
    lockCohortAudience,
    form.cohort_id,
    lockedCohortLabel,
  ]);

  const recurrenceCount = Math.max(1, Number(form.recurrence_count) || 1);
  const previewDates =
    allowRecurrence && form.recurrence_enabled && form.starts_at
      ? previewRecurrenceDates(form.starts_at, recurrenceCount, "weekly")
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Session kind</Label>
          <Select
            value={form.session_kind}
            onValueChange={(value) =>
              setForm({ ...form, session_kind: value as MeetingSessionKind })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_SESSION_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {MEETING_SESSION_KIND_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>

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
                disabled={disabled || programmesQuery.isLoading}
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
              <p className="text-sm font-medium">Weekly series</p>
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
              <div className="space-y-2">
                <Label htmlFor="meeting-recurrence-count">Number of sessions</Label>
                <Input
                  id="meeting-recurrence-count"
                  type="number"
                  min={2}
                  max={52}
                  value={form.recurrence_count}
                  onChange={(e) => setForm({ ...form, recurrence_count: e.target.value })}
                  disabled={disabled}
                />
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
                  Pick a start time to preview weekly session dates.
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
    if (!Number.isInteger(count) || count < 2 || count > 52) {
      return "Series must include between 2 and 52 sessions";
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
    session_kind: form.session_kind,
    access_type: form.access_type,
    venue: form.access_type === "physical" ? form.venue.trim() : undefined,
    starts_at: fromDatetimeLocalValue(form.starts_at),
    verification_lead_minutes: Number(form.verification_lead_minutes),
    duration_minutes: Number(form.duration_minutes),
    recurrence:
      form.recurrence_enabled && recurrenceCount > 1
        ? { frequency: "weekly" as const, count: recurrenceCount }
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
      if (meeting.series_id) {
        router.push(`/meetings/series/${meeting.series_id}`);
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
              ? "Audience is locked to this cohort. Choose online or physical, optional weekly series."
              : "Online or physical sessions, tier or cohort audience, optional weekly series with preview."}
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
        session_kind: payload.session_kind,
        access_type: payload.access_type,
        venue: payload.venue,
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
