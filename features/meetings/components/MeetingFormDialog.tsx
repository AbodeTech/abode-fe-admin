"use client";

import { useState } from "react";
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

import { useCreateMeeting, useUpdateMeeting } from "../hooks/use-meetings";
import {
  DEFAULT_DURATION_MINUTES,
  fromDatetimeLocalValue,
  isGoogleMeetUrl,
  MAX_DURATION_MINUTES,
  MEETING_AUDIENCE_LABELS,
  MEETING_AUDIENCE_TYPES,
  MIN_DURATION_MINUTES,
  toDatetimeLocalValue,
  type Meeting,
  type MeetingAudienceType,
} from "../schemas/meeting.schema";

type FormState = {
  name: string;
  google_meet_url: string;
  audience_type: MeetingAudienceType;
  starts_at: string;
  verification_lead_minutes: string;
  duration_minutes: string;
};

const emptyForm = (): FormState => ({
  name: "",
  google_meet_url: "",
  audience_type: "all_associates",
  starts_at: "",
  verification_lead_minutes: "30",
  duration_minutes: String(DEFAULT_DURATION_MINUTES),
});

function formFromMeeting(meeting: Meeting): FormState {
  return {
    name: meeting.name,
    google_meet_url: meeting.google_meet_url,
    audience_type: meeting.audience_type,
    starts_at: toDatetimeLocalValue(meeting.starts_at),
    verification_lead_minutes: String(meeting.verification_lead_minutes),
    duration_minutes: String(meeting.duration_minutes ?? DEFAULT_DURATION_MINUTES),
  };
}

function MeetingFormFields({
  form,
  setForm,
  disabled,
}: {
  form: FormState;
  setForm: (next: FormState) => void;
  disabled: boolean;
}) {
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Audience</Label>
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
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="meeting-starts">Starts at</Label>
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
          <p className="text-xs text-muted-foreground">
            Backend stores ends_at from start + duration (default {DEFAULT_DURATION_MINUTES}).
          </p>
        </div>
      </div>
    </div>
  );
}

function validateForm(form: FormState): string | null {
  if (!form.name.trim()) return "Name is required";
  if (!isGoogleMeetUrl(form.google_meet_url)) {
    return "Google Meet URL must start with https://meet.google.com/";
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
  return null;
}

export function CreateMeetingDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { mutateAsync, isPending } = useCreateMeeting();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      await mutateAsync({
        name: form.name.trim(),
        google_meet_url: form.google_meet_url.trim(),
        audience_type: form.audience_type,
        starts_at: fromDatetimeLocalValue(form.starts_at),
        verification_lead_minutes: Number(form.verification_lead_minutes),
        duration_minutes: Number(form.duration_minutes),
      });
      toast.success("Meeting created");
      setOpen(false);
      setForm(emptyForm());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create meeting");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setForm(emptyForm());
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="w-full shrink-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Create meeting</DialogTitle>
          <DialogDescription>
            A share URL is generated from the name. Associates join through that link.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <MeetingFormFields form={form} setForm={setForm} disabled={isPending} />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
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
      await mutateAsync({
        id: meeting.id,
        name: form.name.trim(),
        google_meet_url: form.google_meet_url.trim(),
        audience_type: form.audience_type,
        starts_at: fromDatetimeLocalValue(form.starts_at),
        verification_lead_minutes: Number(form.verification_lead_minutes),
        duration_minutes: Number(form.duration_minutes),
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
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>Slug and share URL stay the same when you rename a meeting.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <MeetingFormFields form={form} setForm={setForm} disabled={isPending} />
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
