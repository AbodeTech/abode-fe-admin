"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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

import type { Course } from "../../schemas/course.schema";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/** Design preview — `onToggleStatus` updates local state only; delete just navigates back. */
export function PublishingCard({
  course,
  onToggleStatus,
}: {
  course: Course;
  onToggleStatus: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const isPublished = course.status === "published";

  const handleToggle = () => {
    onToggleStatus();
    toast.success(isPublished ? "Course unpublished" : "Course published");
  };

  const handleDelete = () => {
    toast.success(`${course.title} deleted`);
    router.push("/academy/courses");
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
          <span className="font-medium tabular-nums">{course.modules_count}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground">Estimated time</span>
          <span className="font-medium tabular-nums">{course.estimated_minutes} min</span>
        </div>

        <div className="flex gap-2 pt-3">
          <Button type="button" variant="outline" className="flex-1" onClick={handleToggle}>
            {isPublished ? "Unpublish" : "Publish"}
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
          assignment — a published course is available, full stop.
        </p>
      </div>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {course.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              {course.learners_count > 0
                ? `${course.learners_count} learner${course.learners_count === 1 ? " has" : "s have"} started this course. Deleting it removes it from every associate's view.`
                : "This removes the course and its modules. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              Delete course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
