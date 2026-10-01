"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { FieldStaff } from "../schemas/field-staff.schema";
import { useFieldAssignments } from "../hooks/use-field-staff";
import { Button } from "@/components/ui/button";
import { AssignSiteDialog } from "./AssignSiteDialog";

/** "Assign site" and its dialog. Hidden for a disabled account, which can't be assigned. */
export function AssignSiteButton({ staff }: { staff: FieldStaff }) {
  const [open, setOpen] = useState(false);
  // Same query the history table uses, so this is a cache hit.
  const assignments = useFieldAssignments(staff.id);

  if (staff.status === "disabled") return null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Assign site
      </Button>
      <AssignSiteDialog
        open={open}
        onOpenChange={setOpen}
        staff={{ id: staff.id, name: staff.full_name, staff_type: staff.staff_type }}
        assignments={assignments.data ?? []}
      />
    </>
  );
}
