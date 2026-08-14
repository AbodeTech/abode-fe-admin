"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FlexLeadRow, FlexLeadStatus } from "../hooks/types";
import { useUpdateFlexLead } from "../hooks/use-flex-lead-actions";
import {
  FLEX_LEAD_STATUS_OPTIONS,
  FlexLeadStatusBadge,
} from "./FlexLeadStatusBadge";

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const typeLabel = (type: FlexLeadRow["type"]) =>
  type === "site_inspection" ? "Site inspection" : "Brochure download";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium wrap-break-word">
        {value}
      </span>
    </div>
  );
}

interface FlexLeadDetailModalProps {
  open: boolean;
  row?: FlexLeadRow | null;
  onOpenChange: (open: boolean) => void;
}

export function FlexLeadDetailModal({
  open,
  row,
  onOpenChange,
}: FlexLeadDetailModalProps) {
  const updateLead = useUpdateFlexLead();
  const [status, setStatus] = useState<FlexLeadStatus>("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevRowId, setPrevRowId] = useState<string | null>(null);

  // Reset form when the modal opens or the selected lead changes.
  if (prevOpen !== open || (open && row && prevRowId !== row.id)) {
    setPrevOpen(open);
    if (open && row) {
      setPrevRowId(row.id);
      setStatus(row.status);
      setAdminNotes(row.adminNotes ?? "");
    } else if (!open) {
      setPrevRowId(null);
    }
  }

  if (!row) return null;

  const dirty =
    status !== row.status ||
    adminNotes.trim() !== (row.adminNotes ?? "").trim();

  const handleSave = async () => {
    try {
      await updateLead.mutateAsync({
        id: row.id,
        status,
        adminNotes: adminNotes.trim() || null,
      });
      toast.success("Lead updated.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't update this lead. Try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Flex lead
            <FlexLeadStatusBadge status={row.status} />
          </DialogTitle>
          <DialogDescription>
            {row.fullName} · {typeLabel(row.type)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0.5">
          <DetailRow label="Name" value={row.fullName} />
          <DetailRow label="Email" value={row.email || "—"} />
          <DetailRow label="Phone" value={row.phone || "—"} />
          <DetailRow label="Type" value={typeLabel(row.type)} />
          {row.type === "site_inspection" && (
            <DetailRow label="Location" value={row.location ?? "—"} />
          )}
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
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as FlexLeadStatus)}
            >
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
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || updateLead.isPending}
          >
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
  );
}
