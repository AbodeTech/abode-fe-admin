'use client';

import { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_FREQUENCY_LABELS,
  type ScheduleFrequency,
  type ScheduleInput,
} from '../schemas/programme.schema';

/**
 * DC-02 — builds a cohort's sessions at create time: N online days plus an
 * optional physical day, in one atomic call. Verified against the real
 * `CohortScheduleDto` (`abode-be-v2`, 2026-09-09): `online.days` must be
 * >= 1 when `online` is sent at all — so 0 days means omitting `online`
 * entirely, not sending `days: 0`.
 */

export type ScheduleBuilderValue = {
  schedule: ScheduleInput;
  isValid: boolean;
};

const DEFAULT_ONLINE_DURATION = 90;
const DEFAULT_VERIFICATION_LEAD = 30;

export function ScheduleBuilder({
  onChange,
  disabled,
}: {
  onChange: (value: ScheduleBuilderValue) => void;
  disabled?: boolean;
}) {
  const [onlineDays, setOnlineDays] = useState('2');
  const [onlineStartsAt, setOnlineStartsAt] = useState('');
  const [onlineDuration, setOnlineDuration] = useState(String(DEFAULT_ONLINE_DURATION));
  const [verificationLead, setVerificationLead] = useState(String(DEFAULT_VERIFICATION_LEAD));
  const [frequency, setFrequency] = useState<ScheduleFrequency>('daily');
  const [meetUrl, setMeetUrl] = useState('');
  const [physicalEnabled, setPhysicalEnabled] = useState(false);
  const [physicalDate, setPhysicalDate] = useState('');
  const [physicalVenue, setPhysicalVenue] = useState('');
  const [physicalCity, setPhysicalCity] = useState('');
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);

  const days = Math.max(0, Math.min(30, Number(onlineDays) || 0));
  const durationMinutes = Math.max(1, Number(onlineDuration) || DEFAULT_ONLINE_DURATION);
  const verificationLeadMinutes = Math.max(0, Number(verificationLead) || 0);
  const onlineValid = days === 0 || Boolean(onlineStartsAt);
  const physicalValid =
    !physicalEnabled ||
    (Boolean(physicalDate) && physicalVenue.trim() !== '' && physicalCity.trim() !== '');
  const isValid = onlineValid && physicalValid && (days > 0 || physicalEnabled);

  useEffect(() => {
    const schedule: ScheduleInput = {
      online:
        days > 0 && onlineStartsAt
          ? {
              days,
              starts_at: new Date(onlineStartsAt).toISOString(),
              duration_minutes: durationMinutes,
              verification_lead_minutes: verificationLeadMinutes,
              meet_url: meetUrl.trim() || undefined,
              frequency,
            }
          : undefined,
      physical: physicalEnabled
        ? {
            date: physicalDate ? new Date(physicalDate).toISOString() : '',
            venue: physicalVenue.trim(),
            city: physicalCity.trim(),
            details_confirmed: detailsConfirmed,
          }
        : undefined,
    };
    onChange({ schedule, isValid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    days,
    onlineStartsAt,
    durationMinutes,
    verificationLeadMinutes,
    meetUrl,
    frequency,
    physicalEnabled,
    physicalDate,
    physicalVenue,
    physicalCity,
    detailsConfirmed,
  ]);

  const createsLines: string[] = [];
  for (let i = 1; i <= days; i++) createsLines.push(`Day ${i}`);
  if (physicalEnabled) createsLines.push('Event Day (physical)');

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Schedule</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Builds this cohort&apos;s sessions on save. Edit them afterwards on the Sessions tab.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="online-days">Online sessions (days)</Label>
          <Input
            id="online-days"
            type="number"
            min={0}
            max={30}
            value={onlineDays}
            onChange={(e) => setOnlineDays(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="online-frequency">Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as ScheduleFrequency)}
            disabled={disabled}
          >
            <SelectTrigger id="online-frequency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>
                  {SCHEDULE_FREQUENCY_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="online-duration">Duration (minutes)</Label>
          <Input
            id="online-duration"
            type="number"
            min={1}
            value={onlineDuration}
            onChange={(e) => setOnlineDuration(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="online-lead">Verification lead (minutes)</Label>
          <Input
            id="online-lead"
            type="number"
            min={0}
            value={verificationLead}
            onChange={(e) => setVerificationLead(e.target.value)}
            disabled={disabled}
          />
        </div>
        {days > 0 ? (
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="online-starts">Day 1 starts at</Label>
            <Input
              id="online-starts"
              type="datetime-local"
              value={onlineStartsAt}
              onChange={(e) => setOnlineStartsAt(e.target.value)}
              disabled={disabled}
              required
            />
            <p className="text-xs text-slate-500">
              Following days repeat {frequency === 'weekly' ? 'weekly' : frequency === 'weekdays' ? 'on weekdays' : 'daily'} at this time.
            </p>
          </div>
        ) : null}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="online-meet">Google Meet URL (optional)</Label>
          <Input
            id="online-meet"
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetUrl}
            onChange={(e) => setMeetUrl(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">
            Blank creates the days link pending — reminders hold until a link is set.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Checkbox
            checked={physicalEnabled}
            onCheckedChange={(v) => setPhysicalEnabled(Boolean(v))}
            disabled={disabled}
          />
          Physical day
        </label>
        {physicalEnabled ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="physical-date">Date</Label>
              <Input
                id="physical-date"
                type="date"
                value={physicalDate}
                onChange={(e) => setPhysicalDate(e.target.value)}
                disabled={disabled}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="physical-city">City</Label>
              <Input
                id="physical-city"
                placeholder="Lagos"
                value={physicalCity}
                onChange={(e) => setPhysicalCity(e.target.value)}
                disabled={disabled}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="physical-venue">Venue</Label>
              <Input
                id="physical-venue"
                placeholder="Eko Convention Centre"
                value={physicalVenue}
                onChange={(e) => setPhysicalVenue(e.target.value)}
                disabled={disabled}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox
                checked={detailsConfirmed}
                onCheckedChange={(v) => setDetailsConfirmed(Boolean(v))}
                disabled={disabled}
              />
              Date confirmed
            </label>
          </div>
        ) : null}
      </div>

      <div className="rounded-md border border-dashed bg-slate-50 p-3 text-xs text-slate-600">
        <p>
          <span className="font-medium text-slate-800">Creates:</span>{' '}
          {createsLines.length > 0
            ? createsLines.join(' · ')
            : 'Nothing yet — add online days or a physical day'}
        </p>
        <p className="mt-1">
          <span className="font-medium text-slate-800">Emails:</span> confirmation
          {physicalEnabled ? ' → QR once confirmed' : ''}
          {days > 0 ? ' → reminders' : ''}
        </p>
      </div>
    </div>
  );
}
