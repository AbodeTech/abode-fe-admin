"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { DUMMY_ACADEMY_SETTINGS, DUMMY_COURSES } from "../../dummy-data";
import { COURSE_AUDIENCE_LABELS } from "../../schemas/course.schema";
import { useCourseFormStore } from "../../store/course-form-store";
import { EditablePanel } from "./EditablePanel";
import {
  CourseCoverFields,
  CourseCredentialFields,
  CourseDetailsFields,
  useCourseCoverSection,
  useCourseCredentialSection,
  useCourseDetailsSection,
} from "./EditCourseSections";
import { FirstSalePathCard } from "./FirstSalePathCard";
import { PublishingCard } from "./PublishingCard";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm wrap-break-word">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function CoverPanelBody({
  course,
}: {
  course: (typeof DUMMY_COURSES)[number];
}) {
  const startEditing = useCourseFormStore((state) => state.startEditing);

  if (course.cover_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={course.cover_url}
        alt=""
        className="h-40 w-full rounded-md border object-cover"
      />
    );
  }

  return (
    <div className="rounded-md border border-dashed p-6 text-center">
      <p className="text-sm font-semibold">Drop an image here</p>
      <p className="mt-1 text-xs text-muted-foreground">
        JPG or PNG, up to 5 MB
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => startEditing("cover")}
      >
        Browse files
      </Button>
    </div>
  );
}

/**
 * Design preview — abode-be-v2 has no courses endpoints yet, so this screen
 * runs entirely on features/courses/dummy-data.ts. Every edit here lives in
 * this component's state; refreshing the page resets it. Swap in
 * useCourseDetail / useUpdateCourse (already written, see hooks/) once the
 * BE ships /admin/courses.
 */
export function CourseOverview() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState(
    () => DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0],
  );
  const [firstSalePathId, setFirstSalePathId] = useState(
    DUMMY_ACADEMY_SETTINGS.first_sale_path_course_id,
  );

  const isFirstSalePath = firstSalePathId === course.id;
  const currentHolderTitle =
    firstSalePathId === course.id
      ? null
      : (DUMMY_COURSES.find((c) => c.id === firstSalePathId)?.title ?? null);

  const details = useCourseDetailsSection(course, (values) => {
    setCourse((prev) => ({ ...prev, ...values }));
  });
  const cover = useCourseCoverSection(course, (values) => {
    setCourse((prev) => ({ ...prev, ...values }));
  });
  const credential = useCourseCredentialSection(course, (values) => {
    setCourse((prev) => ({
      ...prev,
      ...values,
      // The BE only reads validity/renewal when the switch is on — null them
      // together so a course that used to grant a credential leaves nothing stale.
      credential_validity_months: values.grants_credential
        ? values.credential_validity_months
        : null,
      credential_renewal: values.grants_credential
        ? values.credential_renewal
        : null,
    }));
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-4">
        <EditablePanel
          id="details"
          title="Details"
          onSave={details.submit}
          form={<CourseDetailsFields form={details.form} />}
        >
          <div className="space-y-4">
            <Field label="Title" value={course.title} />
            <Field
              label="URL slug"
              value={
                <span className="text-muted-foreground">{course.slug}</span>
              }
            />
            <Field label="Summary" value={course.summary} />
            <Field
              label="Audience"
              value={COURSE_AUDIENCE_LABELS[course.audience]}
            />
            <Field
              label="Linked estate"
              value={course.estate_name ?? course.estate_id}
            />
          </div>
        </EditablePanel>

        <EditablePanel
          id="cover"
          title="Cover"
          description="1200 × 630"
          onSave={cover.submit}
          form={<CourseCoverFields form={cover.form} />}
        >
          <CoverPanelBody course={course} />
        </EditablePanel>
      </div>

      <div className="space-y-4">
        <FirstSalePathCard
          course={{ ...course, is_first_sale_path: isFirstSalePath }}
          currentHolderTitle={currentHolderTitle}
          onMakeFirstSalePath={() => setFirstSalePathId(course.id)}
        />

        <EditablePanel
          id="credential"
          title="Credential"
          onSave={credential.submit}
          form={<CourseCredentialFields form={credential.form} />}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold">
                Finishing grants a credential
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.grants_credential ? "On" : "Off"}. A verified badge on
                the associate&apos;s public profile, beside their name on every
                property page they share.
              </p>
            </div>

            <div
              className={
                course.grants_credential
                  ? "space-y-2 border-t pt-3.5"
                  : "space-y-2 border-t pt-3.5 opacity-45"
              }
            >
              <Field
                label="Valid for"
                value={
                  course.credential_validity_months
                    ? `${course.credential_validity_months} months`
                    : null
                }
              />
              <Field
                label="Renewal"
                value={
                  course.credential_renewal
                    ? course.credential_renewal === "refresher"
                      ? "Refresher module only"
                      : "Full retake"
                    : null
                }
              />
              <p className="text-xs text-muted-foreground">
                Unlocks when the switch is on.
              </p>
            </div>
          </div>
        </EditablePanel>

        <PublishingCard
          course={course}
          onToggleStatus={() =>
            setCourse((prev) => ({
              ...prev,
              status: prev.status === "published" ? "draft" : "published",
              published_at:
                prev.status === "published"
                  ? prev.published_at
                  : (prev.published_at ?? new Date().toISOString()),
            }))
          }
        />
      </div>
    </div>
  );
}
