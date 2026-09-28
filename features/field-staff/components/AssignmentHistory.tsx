"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  FIELD_RESPONSIBILITY_LABELS,
  assetName,
  type FieldAssignment,
  type FieldStaff,
} from "../schemas/field-staff.schema";
import { useFieldAssignments } from "../hooks/use-field-staff";
import { formatDate } from "../lib/format";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EndAssignmentDialog } from "./EndAssignmentDialog";

function StatusPill({ a }: { a: FieldAssignment }) {
  const { label, className } =
    a.status === "ended"
      ? { label: "Ended", className: "bg-muted text-muted-foreground" }
      : a.is_active
        ? { label: "Active", className: "bg-[#E0F2F1] text-[#00695C]" }
        : { label: "Starts later", className: "bg-blue-50 text-blue-700" };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", className)}>{label}</span>;
}

const detailOf = (a: FieldAssignment) => (a.end_reason ? `Ended: ${a.end_reason}` : a.note ?? "—");

/**
 * Every site this person has held, open ones first. Ending one only blocks
 * new work from the end date — its history stays.
 */
export function AssignmentHistory({ staff }: { staff: FieldStaff }) {
  const assignments = useFieldAssignments(staff.id);
  const [ending, setEnding] = useState<FieldAssignment | null>(null);

  const rows = [...(assignments.data ?? [])].sort(
    (a, b) =>
      Number(a.status === "ended") - Number(b.status === "ended") ||
      (b.starts_on ?? "").localeCompare(a.starts_on ?? "")
  );

  const endAction = (a: FieldAssignment) =>
    a.status === "ended" ? null : (
      <button type="button" onClick={() => setEnding(a)} className="text-sm text-[#AD1F2A] hover:underline">
        End assignment
      </button>
    );

  return (
    <section className="rounded-xl border bg-white">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Assignment history</h2>
        <p className="text-xs text-muted-foreground">
          Every site {staff.full_name} has covered. Ending an assignment keeps its targets, work and scores.
        </p>
      </header>

      {assignments.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : assignments.error ? (
        <p className="p-4 text-sm text-[#AD1F2A]">{assignments.error.message}</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No assignments yet.</p>
      ) : (
        <div className="p-2 lg:p-0">
          <AdminDesktopTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note / reason</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id} className={cn(a.status === "ended" && "text-muted-foreground")}>
                    <TableCell className="font-medium">{assetName(a.asset)}</TableCell>
                    <TableCell>{FIELD_RESPONSIBILITY_LABELS[a.responsibility]}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(a.starts_on)}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.ends_on ? formatDate(a.ends_on) : "Open-ended"}</TableCell>
                    <TableCell>
                      <StatusPill a={a} />
                    </TableCell>
                    <TableCell className="max-w-[22rem] text-sm">{detailOf(a)}</TableCell>
                    <TableCell className="text-right">{endAction(a)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminDesktopTableWrap>

          <AdminMobileStack>
            {rows.map((a) => (
              <AdminMobileCard key={a.id} title={assetName(a.asset)} subtitle={<StatusPill a={a} />}>
                <AdminMobileField label="Role" value={FIELD_RESPONSIBILITY_LABELS[a.responsibility]} />
                <AdminMobileField label="From" value={formatDate(a.starts_on)} />
                <AdminMobileField label="To" value={a.ends_on ? formatDate(a.ends_on) : "Open-ended"} />
                {(a.end_reason || a.note) && <AdminMobileField label="Note" value={detailOf(a)} />}
                {endAction(a)}
              </AdminMobileCard>
            ))}
          </AdminMobileStack>
        </div>
      )}

      <EndAssignmentDialog
        assignment={ending}
        staffId={staff.id}
        staffName={staff.full_name}
        onOpenChange={(open) => !open && setEnding(null)}
      />
    </section>
  );
}
