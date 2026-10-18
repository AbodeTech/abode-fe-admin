"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FLEX_LEAD_NOTES_MAX,
  FLEX_LEAD_TYPE_LABELS,
  type FlexLeadRow,
  type FlexLeadStatus,
} from "../schemas/flex-lead.schema";
import { useDeleteFlexLead, useUpdateFlexLead } from "../hooks/use-flex-lead-actions";
import { FLEX_LEAD_STATUS_OPTIONS, FlexLeadStatusBadge } from "./FlexLeadStatusBadge";

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG");
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium wrap-break-word">{value}</span>
    </div>
  );
}

interface FlexLeadDetailModalProps {
  open: boolean;
  row?: FlexLeadRow | null;
  onOpenChange: (open: boolean) => void;
}

export function FlexLeadDetailModal({ open, row, onOpenChange }: FlexLeadDetailModalProps) {
  const updateLead = useUpdateFlexLead();
  const deleteLead = useDeleteFlexLead();

  const [status, setStatus] = useState<FlexLeadStatus>("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevRowId, setPrevRowId] = useState<string | null>(null);

  // Reset form when the modal opens or the selected lead changes.
  if (prevOpen !== open || (open && row && prevRowId !== row.id)) {
    setPrevOpen(open);
    if (open && row) {
      setPrevRowId(row.id);
      setStatus(row.status);
      setAdminNotes(row.admin_notes ?? "");
    } else if (!open) {
      setPrevRowId(null);
    }
  }

  if (!row) return null;

  const dirty = status !== row.status || adminNotes.trim() !== (row.admin_notes ?? "").trim();
  const busy = updateLead.isPending || deleteLead.isPending;

  const handleSave = () => {
    updateLead.mutate(
      { id: row.id, status, admin_notes: adminNotes.trim() || null },
      {
        onSuccess: () => {
          toast.success("Lead updated.");
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(error.message || "Couldn't update this lead. Try again."),
      }
    );
  };

  const handleDelete = () => {
    deleteLead.mutate(
      { id: row.id },
      {
        onSuccess: () => {
          toast.success("Lead deleted — recoverable from the audit log.");
          setConfirmDelete(false);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message || "Couldn't delete this lead."),
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              Flex lead
              <FlexLeadStatusBadge status={row.status} />
            </DialogTitle>
            <DialogDescription>
              {row.full_name} · {FLEX_LEAD_TYPE_LABELS[row.type]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-0.5">
            <DetailRow label="Name" value={row.full_name} />
            <DetailRow label="Email" value={row.email || "—"} />
            <DetailRow label="Phone" value={row.phone || "—"} />
            <DetailRow label="Type" value={FLEX_LEAD_TYPE_LABELS[row.type]} />
            {row.type === "site_inspection" ? (
              <>
                <DetailRow label="Location" value={row.location ?? "—"} />
                <DetailRow label="Preferred date" value={row.preferred_date ?? "—"} />
              </>
            ) : null}
            <Separator className="my-2" />
            <DetailRow label="Submitted" value={formatDateTime(row.createdAt)} />
            <DetailRow label="Last updated" value={formatDateTime(row.updatedAt)} />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="flex-lead-status" className="text-sm">
                Status
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as FlexLeadStatus)}>
                <SelectTrigger id="flex-lead-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLEX_LEAD_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flex-lead-notes" className="text-sm">
                Admin notes
              </Label>
              <Textarea
                id="flex-lead-notes"
                rows={4}
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                placeholder="Internal follow-up notes…"
                maxLength={FLEX_LEAD_NOTES_MAX}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {!row.is_deleted ? (
              <Button
                variant="ghost"
                className="mr-auto gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={!dirty || busy}>
              {updateLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              A soft delete — it leaves the working list but stays queryable and is recoverable
              from the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLead.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={deleteLead.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete lead"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
