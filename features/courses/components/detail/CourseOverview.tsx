"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useAcademySettings, useCourseDetail, useSetFirstSalePath, useUpdateCourse } from "../../hooks/use-course-detail";
import { COURSE_AUDIENCE_LABELS, type Course } from "../../schemas/course.schema";
import { useCourseFormStore } from "../../store/course-form-store";
import { getErrorMessage } from "../../utils/error-message";
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

/** Placeholder shape only — used to keep the section hooks' hook-count stable while the real course loads. Never rendered or saved. */
const FALLBACK_COURSE: Course = {
  id: "",
  title: "",
  slug: "",
  summary: null,
  cover_image: null,
  status: "draft",
  audience: "realtor",
  estimated_minutes: 0,
  credential_validity_months: null,
  grants_credential: false,
  created_by: "",
  published_at: null,
};

function CoverPanelBody({ course }: { course: Course }) {
  const startEditing = useCourseFormStore((state) => state.startEditing);

  if (course.cover_image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={course.cover_image}
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

export function CourseOverview() {
  const params = useParams<{ id: string }>();
  const { data: course, isLoading, error } = useCourseDetail(params.id);
  const { data: academySettings } = useAcademySettings();
  const updateCourse = useUpdateCourse(params.id);
  const setFirstSalePath = useSetFirstSalePath();

  const saveCourse = async (values: Partial<Course>, successMessage: string, sectionId: string) => {
    try {
      await updateCourse.mutateAsync(values);
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, `Couldn't save ${sectionId}.`));
      throw err;
    }
  };

  const handleMakeFirstSalePath = async () => {
    if (!course) return;
    try {
      await setFirstSalePath.mutateAsync(course.id);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't set the first-sale path."));
      throw err;
    }
  };

  // Section hooks call useForm/useEffect internally, so they must run every
  // render regardless of loading state — hence the fallback shape instead of
  // an early return above this point (that would change the hook count).
  const details = useCourseDetailsSection(course ?? FALLBACK_COURSE, (values) =>
    saveCourse(values, "Course details saved", "details")
  );
  const cover = useCourseCoverSection(course ?? FALLBACK_COURSE, (values) => saveCourse(values, "Cover saved", "cover"));
  const credential = useCourseCredentialSection(course ?? FALLBACK_COURSE, (values) =>
    saveCourse(values, "Credential settings saved", "credential")
  );

  if (isLoading) return <PageContentLoader label="Loading course…" />;

  if (error || !course) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Couldn&apos;t load this course</h3>
        <p>{getErrorMessage(error, "It may have been deleted.")}</p>
      </div>
    );
  }

  const firstSalePathId = academySettings?.first_sale_path_course_id ?? null;
  const isFirstSalePath = firstSalePathId === course.id;
  const hasOtherHolder = firstSalePathId !== null && firstSalePathId !== course.id;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-4">
        <EditablePanel
          id="details"
          title="Details"
          onSave={details.submit}
          isSaving={details.isSaving}
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
            <Field label="Estimated time" value={`${course.estimated_minutes} min`} />
          </div>
        </EditablePanel>

        <EditablePanel
          id="cover"
          title="Cover"
          description="1200 × 630"
          onSave={cover.submit}
          isSaving={cover.isSaving}
          form={<CourseCoverFields form={cover.form} />}
        >
          <CoverPanelBody course={course} />
        </EditablePanel>
      </div>

      <div className="space-y-4">
        <FirstSalePathCard
          course={course}
          isFirstSalePath={isFirstSalePath}
          hasOtherHolder={hasOtherHolder}
          onMakeFirstSalePath={handleMakeFirstSalePath}
          isSaving={setFirstSalePath.isPending}
        />

        <EditablePanel
          id="credential"
          title="Credential"
          onSave={credential.submit}
          isSaving={credential.isSaving}
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
              <p className="text-xs text-muted-foreground">
                Unlocks when the switch is on.
              </p>
            </div>
          </div>
        </EditablePanel>

        <PublishingCard course={course} />
      </div>
    </div>
  );
}
