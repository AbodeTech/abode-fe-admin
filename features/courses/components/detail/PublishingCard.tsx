"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useDeleteCourse, usePublishCourse, useUnpublishCourse } from "../../hooks/use-course-detail";
import { useCourseLearners } from "../../hooks/use-learners";
import type { CourseDetail } from "../../schemas/course.schema";
import { getErrorMessage } from "../../utils/error-message";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * `course` is the detail shape (with embedded `modules`) rather than the
 * plain list-row `Course` — `modules.length` is the only real module count
 * the BE exposes anywhere (there's no roll-up on the list or a bare course
 * record). There's likewise no learners-count field on the course record, so
 * the delete-warning below asks `GET /admin/courses/:id/learners?limit=1`
 * for a real number instead of guessing.
 */
export function PublishingCard({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const publishCourse = usePublishCourse(course.id);
  const unpublishCourse = useUnpublishCourse(course.id);
  const deleteCourse = useDeleteCourse();
  const { data: learners } = useCourseLearners(course.id, { page: 1, limit: 1 });
  const learnerCount = learners?.meta.total ?? 0;

  const isPublished = course.status === "published";
  const isToggling = publishCourse.isPending || unpublishCourse.isPending;

  const handleToggle = () => {
    if (isPublished) {
      unpublishCourse.mutate(undefined, {
        onSuccess: () => toast.success("Course unpublished"),
        onError: (err) => toast.error(getErrorMessage(err, "Couldn't unpublish the course.")),
      });
    } else {
      publishCourse.mutate(undefined, {
        onSuccess: () => toast.success("Course published"),
        onError: (err) =>
          toast.error(
            getErrorMessage(
              err,
              "A course needs at least one module with content before it can be published."
            )
          ),
      });
    }
  };

  const handleDelete = () => {
    deleteCourse.mutate(course.id, {
      onSuccess: () => {
        toast.success(`${course.title} deleted`);
        router.push("/academy/courses");
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, "Couldn't delete the course."));
        setDeleting(false);
      },
    });
  };

  return (
    <section className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">Publishing</h2>
      </div>
      <div className="space-y-1 p-4 text-sm">
        <div className="flex items-center justify-between border-b py-2.5">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center justify-between border-b py-2.5">
          <span className="text-muted-foreground">First published</span>
          <span className="font-medium tabular-nums">{formatDate(course.published_at)}</span>
        </div>
        <div className="flex items-center justify-between border-b py-2.5">
          <span className="text-muted-foreground">Modules</span>
          <span className="font-medium tabular-nums">{course.modules.length}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Estimated time</span>
          <span className="font-medium tabular-nums">{course.estimated_minutes} min</span>
        </div>

        <div className="flex gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleToggle}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublished ? (
              "Unpublish"
            ) : (
              "Publish"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleting(true)}
            aria-label="Delete course"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <p className="pt-2.5 text-xs text-muted-foreground">
          Published courses are visible to every associate in the audience. There is no per-person
          assignment — a published course is available, full stop. Publishing is refused until the
          course has at least one module with content.
        </p>
      </div>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {course.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              {learnerCount > 0
                ? `${learnerCount} learner${learnerCount === 1 ? " has" : "s have"} started this course. Deleting it removes it from every associate's view.`
                : "This removes the course and its modules. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCourse.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteCourse.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {deleteCourse.isPending ? "Deleting…" : "Delete course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
