"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GetIssueQuery } from "@/lib/gql/graphql";
import { useResolveIssue } from "../hooks/use-issues";
import { STATUS_LABELS, STATUS_PILL_CLASS } from "../lib/ticket-display";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string;
  issueTitle: string;
  linkedTickets: NonNullable<GetIssueQuery["getIssue"]["tickets"]>;
  onResolved?: () => void;
}

/**
 * Resolves the issue AND every linked ticket in one BE call. Requires
 * confirmCustomersContacted to be true — nothing sends automatically,
 * so this is deliberate. Tickets can be excluded (the escape hatch for
 * tickets that also raised a different problem).
 */
export function ResolveIssueDialog({
  open,
  onOpenChange,
  issueId,
  issueTitle,
  linkedTickets,
  onResolved,
}: Props) {
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});

  const resolve = useResolveIssue();

  const excludeIds = useMemo(
    () => Object.keys(excluded).filter((id) => excluded[id]),
    [excluded]
  );

  const willResolveCount = linkedTickets.length - excludeIds.length;

  const handleClose = () => {
    if (resolve.isPending) return;
    setNote("");
    setConfirmed(false);
    setExcluded({});
    onOpenChange(false);
  };

  const handleResolve = async () => {
    if (!note.trim() || !confirmed) return;
    try {
      const res = await resolve.mutateAsync({
        issueId,
        resolutionNote: note.trim(),
        excludeTicketIds: excludeIds.length > 0 ? excludeIds : undefined,
        confirmCustomersContacted: true,
      });
      toast.success(
        `Issue resolved · ${res.resolveIssue.ticketsResolved} ticket${res.resolveIssue.ticketsResolved === 1 ? "" : "s"} closed · ${res.resolveIssue.customersAffected} customer${res.resolveIssue.customersAffected === 1 ? "" : "s"} affected`
      );
      onResolved?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Resolve issue
          </DialogTitle>
          <DialogDescription>
            Closes <b>{issueTitle}</b> and, in the same call, resolves every
            linked ticket unless you exclude it below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="note">Resolution note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was the root cause and how was it fixed?"
              rows={3}
              className="bg-white text-sm resize-none"
              autoFocus
            />
          </div>

          {linkedTickets.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>
                  Linked tickets
                  <span className="text-xs text-gray-500 ml-1 font-normal">
                    ({willResolveCount} will close, {excludeIds.length} kept open)
                  </span>
                </Label>
              </div>
              <div className="rounded-md border border-gray-200 divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {linkedTickets.map((t) => {
                  const excludedRow = !!excluded[t._id];
                  return (
                    <label
                      key={t._id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors",
                        excludedRow ? "bg-amber-50/60" : "hover:bg-gray-50"
                      )}
                    >
                      <Checkbox
                        checked={excludedRow}
                        onCheckedChange={(v) =>
                          setExcluded((s) => ({ ...s, [t._id]: !!v }))
                        }
                        aria-label={`Keep ${t.ticket_ref} open`}
                      />
                      <span className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 tabular-nums shrink-0">
                          {t.ticket_ref}
                        </span>
                        <span
                          className={cn(
                            "text-gray-800 truncate leading-tight",
                            excludedRow && "line-through decoration-1 text-gray-500"
                          )}
                        >
                          {t.subject}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_PILL_CLASS[t.status]
                        )}
                      >
                        {STATUS_LABELS[t.status]}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500">
                Check a ticket to <b>keep it open</b> — the escape hatch for
                tickets that also raised a different problem.
              </p>
            </div>
          )}

          <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 cursor-pointer">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(!!v)}
              className="mt-0.5"
            />
            <span className="flex-1">
              <span className="font-medium flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Customers have been contacted
              </span>
              <span className="text-xs block mt-0.5">
                Nothing is sent automatically. Confirm the {willResolveCount} affected
                customer{willResolveCount === 1 ? " has" : "s have"} heard from you
                before closing.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={resolve.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!note.trim() || !confirmed || resolve.isPending}
          >
            {resolve.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Resolve issue + {willResolveCount} ticket{willResolveCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
