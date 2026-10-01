"use client";

import { useEffect, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useUploadMedia } from "../../hooks/use-media";
import { COURSE_AUDIENCES, COURSE_AUDIENCE_LABELS } from "../../schemas/course.schema";
import type { Course } from "../../schemas/course.schema";
import {
  courseCoverFormSchema,
  courseCredentialFormSchema,
  courseDetailsFormSchema,
  courseToCoverForm,
  courseToCredentialForm,
  courseToDetailsForm,
  type CourseCoverFormValues,
  type CourseCredentialFormValues,
  type CourseDetailsFormValues,
} from "../../schemas/edit-course.schema";
import { getErrorMessage } from "../../utils/error-message";
import { useCourseFormStore } from "../../store/course-form-store";

export type SectionForm<TValues extends Record<string, unknown>> = {
  form: UseFormReturn<TValues>;
  submit: () => void;
  /** True while `onSave` is in flight — pass to EditablePanel's `isSaving`. */
  isSaving: boolean;
};

/**
 * Re-seed exactly once when editing opens — not on every render while it's
 * open. `seed` is a fresh closure every render (it closes over `course`), so
 * putting it in the effect's own deps re-ran `reset()` on *every* re-render
 * while editing — including ones caused by an unrelated background refetch —
 * silently snapping the form back to server values and discarding whatever
 * the admin had just typed or toggled. A ref sidesteps that: the effect only
 * depends on `editing` itself, and fires on the false→true transition.
 */
function useReseedOnOpen(sectionId: string, seed: () => void) {
  const editing = useCourseFormStore((state) => state.editingSections[sectionId] ?? false);
  const seedRef = useRef(seed);
  const wasEditing = useRef(false);

  // Keep the ref current *after* render, not during it — mutating a ref's
  // `.current` while rendering is itself unsafe, even when the value read
  // back out is only ever used inside an effect.
  useEffect(() => {
    seedRef.current = seed;
  });

  useEffect(() => {
    if (editing && !wasEditing.current) seedRef.current();
    wasEditing.current = editing;
  }, [editing]);
}

/* -------------------- details -------------------- */

export function useCourseDetailsSection(
  course: Course,
  onSave: (values: CourseDetailsFormValues) => void | Promise<void>
): SectionForm<CourseDetailsFormValues> {
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  const form = useForm<CourseDetailsFormValues>({
    resolver: zodResolver(courseDetailsFormSchema),
    defaultValues: courseToDetailsForm(course),
  });

  const { reset } = form;
  useReseedOnOpen("details", () => reset(courseToDetailsForm(course)));

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      stopEditing("details");
    } catch {
      // caller already surfaced the error via toast
    }
  });

  return { form, submit, isSaving: form.formState.isSubmitting };
}

function AudienceToggle({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="inline-flex gap-1 rounded-md bg-muted p-1">
      {COURSE_AUDIENCES.map((audience) => (
        <button
          key={audience}
          type="button"
          onClick={() => onChange(audience)}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
            value === audience
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {COURSE_AUDIENCE_LABELS[audience]}
        </button>
      ))}
    </div>
  );
}

export function CourseDetailsFields({ form }: { form: UseFormReturn<CourseDetailsFormValues> }) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Summary</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Shown on the course card, and on the dashboard checkpoint if this is the first-sale path.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Audience</FormLabel>
              <FormControl>
                <AudienceToggle value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription className="text-xs">
                Buyer courses cannot be the first-sale path — that checkpoint only exists on the realtor dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimated_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Estimated time (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => field.onChange(e.target.value === "" ? 0 : e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription className="text-xs">
                A plain estimate you set yourself — not calculated from the modules.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

/* -------------------- cover -------------------- */

export function useCourseCoverSection(
  course: Course,
  onSave: (values: CourseCoverFormValues) => void | Promise<void>
): SectionForm<CourseCoverFormValues> {
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  const form = useForm<CourseCoverFormValues>({
    resolver: zodResolver(courseCoverFormSchema),
    defaultValues: courseToCoverForm(course),
  });

  const { reset } = form;
  useReseedOnOpen("cover", () => reset(courseToCoverForm(course)));

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      stopEditing("cover");
    } catch {
      // caller already surfaced the error via toast
    }
  });

  return { form, submit, isSaving: form.formState.isSubmitting };
}

export function CourseCoverFields({ form }: { form: UseFormReturn<CourseCoverFormValues> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadMedia();

  const handleFile = (file: File) => {
    upload.mutate(
      { kind: "image", file },
      {
        onSuccess: (asset) => {
          const url = asset.renditions.source ?? null;
          if (url) form.setValue("cover_image", url, { shouldDirty: true });
          else toast.error("Upload finished, but the file has no URL yet — try again.");
        },
        onError: (err) => toast.error(getErrorMessage(err, "Upload failed.")),
      }
    );
  };

  return (
    <Form {...form}>
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div
          className="rounded-md border border-dashed p-4 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <p className="text-sm font-semibold">Drop an image here</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? "Uploading…" : "Browse files"}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="cover_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Or paste an image URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="https://…"
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormDescription className="text-xs">JPG or PNG, 1200 × 630.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

/* -------------------- credential -------------------- */

export function useCourseCredentialSection(
  course: Course,
  onSave: (values: CourseCredentialFormValues) => void | Promise<void>
): SectionForm<CourseCredentialFormValues> {
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  const form = useForm<CourseCredentialFormValues>({
    resolver: zodResolver(courseCredentialFormSchema),
    defaultValues: courseToCredentialForm(course),
  });

  const { reset } = form;
  useReseedOnOpen("credential", () => reset(courseToCredentialForm(course)));

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      stopEditing("credential");
    } catch {
      // caller already surfaced the error via toast
    }
  });

  return { form, submit, isSaving: form.formState.isSubmitting };
}

export function CourseCredentialFields({ form }: { form: UseFormReturn<CourseCredentialFormValues> }) {
  const grants = form.watch("grants_credential");

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="grants_credential"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                </FormControl>
                <Label className="text-sm font-normal">Finishing grants a credential</Label>
              </div>
              <FormDescription className="text-xs">
                A verified badge on the associate&apos;s public profile, beside their name on every property page
                they share.
              </FormDescription>
            </FormItem>
          )}
        />

        <div className={cn("space-y-4 border-t pt-4", !grants && "opacity-45")}>
          <FormField
            control={form.control}
            name="credential_validity_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Valid for (months)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    disabled={!grants}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground">Unlocks when the switch is on.</p>
        </div>
      </div>
    </Form>
  );
}
