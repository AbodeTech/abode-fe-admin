"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { assetName, type FieldAssignment } from "../schemas/field-staff.schema";
import {
  dateOnly,
  makeEndAssignmentFormSchema,
  todayIso,
  type EndAssignmentFormValues,
} from "../schemas/staff-form.schema";
import { useEndFieldAssignment } from "../hooks/use-field-staff-mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EndAssignmentDialogProps {
  assignment: FieldAssignment | null;
  staffId: string;
  staffName: string;
  onOpenChange: (open: boolean) => void;
}

/** End one assignment. History is kept; only new work after the end date is blocked. It can't be undone. */
export function EndAssignmentDialog({ assignment, staffId, staffName, onOpenChange }: EndAssignmentDialogProps) {
  return (
    <Dialog open={!!assignment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {assignment && (
          <EndAssignmentForm
            key={assignment.id}
            assignment={assignment}
            staffId={staffId}
            staffName={staffName}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EndAssignmentForm({
  assignment,
  staffId,
  staffName,
  onClose,
}: {
  assignment: FieldAssignment;
  staffId: string;
  staffName: string;
  onClose: () => void;
}) {
  const end = useEndFieldAssignment();
  const startsOn = dateOnly(assignment.starts_on);
  const schema = useMemo(() => makeEndAssignmentFormSchema(startsOn), [startsOn]);
  const today = todayIso();
  const site = assetName(assignment.asset);

  const form = useForm<EndAssignmentFormValues>({
    resolver: zodResolver(schema),
    // An assignment that hasn't started yet ends on its own start date.
    defaultValues: { ends_on: startsOn && today < startsOn ? startsOn : today, reason: "" },
  });

  const onSubmit = (values: EndAssignmentFormValues) => {
    end.mutate(
      { staffId, assignmentId: assignment.id, payload: { ends_on: values.ends_on, reason: values.reason.trim() } },
      {
        onSuccess: () => {
          toast.success(`${site} assignment ended`);
          onClose();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>End the {site} assignment</DialogTitle>
        <DialogDescription>{staffName}</DialogDescription>
      </DialogHeader>

      <ul className="space-y-1 rounded-lg bg-muted/60 p-3 text-sm">
        <li>From the end date they can&apos;t record new work for this site.</li>
        <li>Targets, work and scores from before it stay on record.</li>
        <li>The end date can&apos;t be changed later. To put them back, assign the site again.</li>
      </ul>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="ends_on"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input type="date" min={startsOn ?? undefined} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl>
                  <Textarea rows={3} maxLength={300} placeholder="e.g. Moved to another site" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={end.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={end.isPending}>
              {end.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              End assignment
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
