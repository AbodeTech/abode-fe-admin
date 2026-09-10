"use client";

import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  COURSE_AUDIENCES,
  COURSE_AUDIENCE_LABELS,
  CREDENTIAL_RENEWALS,
  CREDENTIAL_RENEWAL_LABELS,
} from "../../schemas/course.schema";
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
import { useCourseFormStore } from "../../store/course-form-store";

/**
 * Design preview — no backend yet. Saving updates the course object held in
 * CourseOverview's local state via `onSave`; nothing is persisted past a
 * refresh. Swap `onSave` for a mutation once /admin/courses exists.
 */
export type SectionForm<TValues extends Record<string, unknown>> = {
  form: UseFormReturn<TValues>;
  submit: () => void;
};

/** Re-seed whenever editing opens, so a cancelled edit never lingers. */
function useReseedOnOpen(sectionId: string, seed: () => void) {
  const editing = useCourseFormStore((state) => state.editingSections[sectionId] ?? false);

  useEffect(() => {
    if (editing) seed();
  }, [editing, seed]);
}

/* -------------------- details -------------------- */

export function useCourseDetailsSection(
  course: Course,
  onSave: (values: CourseDetailsFormValues) => void
): SectionForm<CourseDetailsFormValues> {
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  const form = useForm<CourseDetailsFormValues>({
    resolver: zodResolver(courseDetailsFormSchema),
    defaultValues: courseToDetailsForm(course),
  });

  const { reset } = form;
  useReseedOnOpen("details", () => reset(courseToDetailsForm(course)));

  const submit = form.handleSubmit((values) => {
    onSave(values);
    toast.success("Course details saved");
    stopEditing("details");
  });

  return { form, submit };
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
          name="estate_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Linked estate</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Asset ID"
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Lets the course pull live prices instead of copy that goes stale.
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
  onSave: (values: CourseCoverFormValues) => void
): SectionForm<CourseCoverFormValues> {
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  const form = useForm<CourseCoverFormValues>({
    resolver: zodResolver(courseCoverFormSchema),
    defaultValues: courseToCoverForm(course),
  });

  const { reset } = form;
  useReseedOnOpen("cover", () => reset(courseToCoverForm(course)));

  const submit = form.handleSubmit((values) => {
    onSave(values);
    toast.success("Cover saved");
    stopEditing("cover");
  });

  return { form, submit };
}

export function CourseCoverFields({ form }: { form: UseFormReturn<CourseCoverFormValues> }) {
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="cover_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Image URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="https://…"
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Direct upload isn&apos;t wired up yet — paste an image URL. JPG or PNG, 1200 × 630.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

/* -------------------- credential -------------------- */

export function useCourseCredentialSection(
  course: Course,
  onSave: (values: CourseCredentialFormValues) => void
): SectionForm<CourseCredentialFormValues> {
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  const form = useForm<CourseCredentialFormValues>({
    resolver: zodResolver(courseCredentialFormSchema),
    defaultValues: courseToCredentialForm(course),
  });

  const { reset } = form;
  useReseedOnOpen("credential", () => reset(courseToCredentialForm(course)));

  const submit = form.handleSubmit((values) => {
    onSave(values);
    toast.success("Credential settings saved");
    stopEditing("credential");
  });

  return { form, submit };
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

          <FormField
            control={form.control}
            name="credential_renewal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Renewal</FormLabel>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                  disabled={!grants}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CREDENTIAL_RENEWALS.map((renewal) => (
                      <SelectItem key={renewal} value={renewal}>
                        {CREDENTIAL_RENEWAL_LABELS[renewal]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
