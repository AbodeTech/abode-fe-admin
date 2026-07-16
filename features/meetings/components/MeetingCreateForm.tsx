"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, AlertCircle, Copy, Check } from "lucide-react";
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
import { AUDIENCE_OPTIONS, resolveMeetingShareUrl } from "../lib/meet-validation";
import {
  createMeetingSchema,
  type MeetingFormValues,
} from "../schemas/meeting.schema";
import { useCreateMeeting } from "../hooks/use-meeting-mutations";
import type { Meeting } from "../types";

const EMPTY_CREATE_VALUES: MeetingFormValues = {
  name: "",
  google_meet_url: "",
  starts_at: "",
  audience_type: "all_associates",
  verification_lead_minutes: 30,
};

interface MeetingCreateFormProps {
  onCreated?: (meeting: Meeting) => void;
}

export function MeetingCreateForm({ onCreated }: MeetingCreateFormProps) {
  const [created, setCreated] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const createMutation = useCreateMeeting();

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(createMeetingSchema) as Resolver<MeetingFormValues>,
    mode: "onChange",
    defaultValues: EMPTY_CREATE_VALUES,
  });

  const canCreate = form.formState.isValid && !createMutation.isPending;

  async function onSubmit(values: MeetingFormValues) {
    if (
      values.verification_lead_minutes === undefined ||
      Number.isNaN(values.verification_lead_minutes)
    ) {
      return;
    }

    try {
      const meeting = await createMutation.mutateAsync({
        ...values,
        verification_lead_minutes: values.verification_lead_minutes,
      });
      setCreated(meeting);
      setCopied(false);
      onCreated?.(meeting);

      form.reset(EMPTY_CREATE_VALUES);
      // Remount controlled fields (Select / datetime) so the UI fully clears
      setFormKey((k) => k + 1);
      toast.success("Meeting link created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create meeting.");
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied");
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Create Meeting Link</h2>
      <p className="mt-1 text-sm text-gray-500">
        Generate a shareable link that verifies associates before sending them to Google Meet.
      </p>

      <Form {...form}>
        <form
          key={formKey}
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting name</FormLabel>
                <FormControl>
                  <Input placeholder="Associate Town Hall — Q2" {...field} />
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
                  <Input
                    type="url"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    {...field}
                  />
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
                <FormLabel>
                  Start date &amp; time{" "}
                  <span className="font-normal text-gray-400">(WAT)</span>
                </FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value ?? ""} />
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
                      <SelectValue placeholder="Select audience" />
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

          {created && (
            <div className="rounded-lg bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle size={16} />
                Meeting link created
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="flex-1 break-all rounded bg-white px-2 py-1.5 text-sm font-medium text-gray-900">
                  {resolveMeetingShareUrl(created)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(resolveMeetingShareUrl(created))}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}

          {createMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={16} />
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create meeting."}
            </div>
          )}

          <Button type="submit" disabled={!canCreate}>
            {createMutation.isPending ? "Creating…" : "Create Meeting Link"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
