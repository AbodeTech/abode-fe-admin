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
import { AUDIENCE_OPTIONS } from "../lib/meet-validation";
import { toDatetimeLocalValue } from "../lib/meet-time";
import {
  createMeetingSchema,
  type CreateMeetingFormValues,
} from "../schemas/meeting.schema";
import { useUpdateMeeting } from "../hooks/use-meeting-mutations";
import type { Meeting } from "../hooks/mock-meetings";

interface MeetingEditFormProps {
  meeting: Meeting;
}

export function MeetingEditForm({ meeting }: MeetingEditFormProps) {
  const router = useRouter();
  const updateMutation = useUpdateMeeting();

  const form = useForm<CreateMeetingFormValues>({
    resolver: zodResolver(createMeetingSchema) as Resolver<CreateMeetingFormValues>,
    defaultValues: {
      name: meeting.name,
      google_meet_url: meeting.google_meet_url,
      starts_at: toDatetimeLocalValue(meeting.starts_at),
      audience_type: meeting.audience_type,
      verification_lead_minutes: meeting.verification_lead_minutes,
    },
  });

  useEffect(() => {
    form.reset({
      name: meeting.name,
      google_meet_url: meeting.google_meet_url,
      starts_at: toDatetimeLocalValue(meeting.starts_at),
      audience_type: meeting.audience_type,
      verification_lead_minutes: meeting.verification_lead_minutes,
    });
  }, [meeting, form]);

  async function onSubmit(values: CreateMeetingFormValues) {
    try {
      await updateMutation.mutateAsync({ meetingId: meeting._id, input: values });
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
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input type="number" min={5} max={120} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={updateMutation.isPending}>
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
