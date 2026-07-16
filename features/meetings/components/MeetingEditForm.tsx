"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIENCE_OPTIONS, toAudienceType } from "../lib/meet-validation";
import { toDatetimeLocalValue } from "../lib/meet-time";
import {
  createMeetingSchema,
  type MeetingFormValues,
} from "../schemas/meeting.schema";
import { useUpdateMeeting } from "../hooks/use-meeting-mutations";
import type { Meeting } from "../types";

interface MeetingEditFormProps {
  meeting: Meeting;
}

export function MeetingEditForm({ meeting }: MeetingEditFormProps) {
  const router = useRouter();
  const updateMutation = useUpdateMeeting();

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(createMeetingSchema) as Resolver<MeetingFormValues>,
    mode: "onChange",
    defaultValues: {
      name: meeting.name,
      google_meet_url: meeting.google_meet_url,
      starts_at: toDatetimeLocalValue(meeting.starts_at),
      audience_type: toAudienceType(meeting.audience_type),
      verification_lead_minutes: meeting.verification_lead_minutes,
    },
  });

  const canSave = form.formState.isValid && !updateMutation.isPending;

  useEffect(() => {
    form.reset({
      name: meeting.name,
      google_meet_url: meeting.google_meet_url,
      starts_at: toDatetimeLocalValue(meeting.starts_at),
      audience_type: toAudienceType(meeting.audience_type),
      verification_lead_minutes: meeting.verification_lead_minutes,
    });
    void form.trigger();
  }, [meeting, form]);

  async function onSubmit(values: MeetingFormValues) {
    if (
      values.verification_lead_minutes === undefined ||
      Number.isNaN(values.verification_lead_minutes)
    ) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        meetingId: meeting._id,
        input: {
          ...values,
          verification_lead_minutes: values.verification_lead_minutes,
        },
      });
      toast.success("Meeting updated");
      router.push(`/meetings/${meeting._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update meeting.");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Edit Meeting</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="google_meet_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Meet URL</FormLabel>
                <FormControl>
                  <Input type="url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="starts_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date &amp; time (WAT)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audience_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex flex-col items-start gap-0.5">
                          <span>{opt.label}</span>
                          <span className="text-xs font-normal text-gray-500">
                            {opt.description}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Eligible referral statuses:{" "}
                  {AUDIENCE_OPTIONS.find((o) => o.value === field.value)?.description}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="verification_lead_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification opens (minutes before start)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    inputMode="numeric"
                    value={
                      field.value === undefined || Number.isNaN(field.value)
                        ? ""
                        : field.value
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(raw === "" ? undefined : Number(raw));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={!canSave}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/meetings/${meeting._id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
