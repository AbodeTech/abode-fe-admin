"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";

import type { Course } from "../../schemas/course.schema";

/**
 * The two controls that decide what a course *means* get their own cards.
 * Exactly one course can hold this — setting it here takes it off whichever
 * course has it today, and this card says so before the admin presses
 * anything.
 *
 * `is_first_sale_path` isn't a field on the course record — the BE's
 * `academy_settings` singleton only carries an id, no title (see
 * academy-settings.schema.ts), so the caller passes down whether *this*
 * course holds it and whether some *other* course does, rather than a name
 * to display. `PATCH /admin/academy-settings` also 400s
 * (`FIRST_SALE_COURSE_NOT_PUBLISHED`) unless the target is already
 * published — gated here so the action isn't offered when it would just fail.
 *
 * Only the header is dark (matching the design's `.card.hi` — the body stays
 * on the normal white card surface); a "1" badge marks it as checkpoint one.
 */
export function FirstSalePathCard({
  course,
  isFirstSalePath,
  hasOtherHolder,
  onMakeFirstSalePath,
  isSaving,
}: {
  course: Course;
  isFirstSalePath: boolean;
  /** Whether some other course currently holds it (the BE gives no title for it). */
  hasOtherHolder: boolean;
  onMakeFirstSalePath: () => Promise<void>;
  isSaving?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  const isBuyerCourse = course.audience === "buyer";
  const isPublished = course.status === "published";

  const handleConfirm = async () => {
    try {
      await onMakeFirstSalePath();
      toast.success(`${course.title} is now the first-sale path`);
      setConfirming(false);
    } catch {
      // caller already surfaced the error via toast
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b bg-foreground px-4 py-3">
        <h2 className="font-medium text-background">First sale path</h2>
      </div>
      <div className="p-4">
        {isFirstSalePath ? (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-base font-semibold text-background">
              1
            </div>
            <p className="text-sm">
              This is the first-sale path today. It shows as checkpoint 1 on the dashboard of every
              realtor with no sales.
            </p>
          </div>
        ) : isBuyerCourse ? (
          <p className="text-sm text-muted-foreground">
            Buyer courses can&apos;t be the first-sale path — that checkpoint only exists on the realtor
            dashboard.
          </p>
        ) : !isPublished ? (
          <p className="text-sm text-muted-foreground">
            Publish this course first — the first-sale path can only point at a published course.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-base font-semibold text-background">
                1
              </div>
              <div>
                <p className="text-sm font-semibold">Not this course</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {hasOtherHolder
                    ? "Another course is the first-sale path today. It shows as checkpoint 1 on the dashboard of every realtor with no sales."
                    : "No course currently holds it."}
                </p>
              </div>
            </div>
            <Button type="button" className="mt-3.5 w-full justify-center" onClick={() => setConfirming(true)}>
              Make this the first-sale path
            </Button>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Only one course can hold it
              {hasOtherHolder ? " — doing this moves it off the course that has it" : ""}. You will be
              asked to confirm, and it is written to the admin log.
            </p>
          </>
        )}
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {course.title} the first-sale path?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasOtherHolder
                ? `This takes the first-sale path off whichever course has it today. Every realtor with no sales will see ${course.title} as checkpoint 1 instead.`
                : `${course.title} will show as checkpoint 1 on the dashboard of every realtor with no sales.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              {isSaving ? "Confirming…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
