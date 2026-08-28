"use client";

import { useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTicketAdminPicker } from "../hooks/use-ticket-pickers";
import { useAddTicketCollaborator } from "../hooks/use-ticket-mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  /** Already on the ticket — owner plus existing collaborators. */
  excludeAdminIds: string[];
  onAdded?: () => void;
}

const initialsOf = (source: string) => {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase() || "?";
};

/**
 * Pull a specialist onto a ticket — a developer on a tech fault, finance on a
 * payment. They can act on it and close it; the assigned admin stays
 * accountable for the outcome.
 *
 * The owner and anyone already collaborating are filtered out rather than
 * shown-and-rejected: the BE errors on adding the assigned admin, and
 * $addToSet makes a repeat add a silent no-op, so neither is worth a round trip.
 */
export function AddCollaboratorDialog({
  open,
  onOpenChange,
  ticketId,
  excludeAdminIds,
  onAdded,
}: Props) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { data: options, isLoading } = useTicketAdminPicker(query);
  const add = useAddTicketCollaborator();

  const available = options.filter((a) => !excludeAdminIds.includes(a._id));

  const handleClose = () => {
    if (add.isPending) return;
    setQuery("");
    setPickedId(null);
    onOpenChange(false);
  };

  const handleAdd = async () => {
    if (!pickedId) return;
    try {
      await add.mutateAsync({ ticketId, adminId: pickedId });
      toast.success("Collaborator added");
      onAdded?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add collaborator"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add collaborator</DialogTitle>
          <DialogDescription>
            Pull in a specialist to help resolve this. They can act on the
            ticket and close it — the assigned admin stays accountable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admins…"
              className="pl-8"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/60">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : available.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {options.length === 0
                  ? "No matching admins."
                  : "Everyone matching is already on this ticket."}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {available.map((a) => {
                  const picked = pickedId === a._id;
                  return (
                    <li key={a._id}>
                      <button
                        type="button"
                        onClick={() => setPickedId(a._id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          picked ? "bg-[#E0F2F1] text-[#00695C]" : "hover:bg-white"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initialsOf(a.displayName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {a.displayName}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight truncate">
                            {a.email} · {a.role}
                          </p>
                        </div>
                        {picked && <UserPlus className="h-4 w-4 text-[#00695C]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={add.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!pickedId || add.isPending}>
            {add.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Add collaborator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
