"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
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
import { useUpdateTicket } from "../hooks/use-ticket-mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  currentAdminId?: string | null;
  onAssigned?: () => void;
}

const initialsOf = (source: string) => {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase() || "?";
};

export function AssignAdminDialog({
  open,
  onOpenChange,
  ticketId,
  currentAdminId,
  onAssigned,
}: Props) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(
    currentAdminId ?? null
  );
  const { data: options, isLoading } = useTicketAdminPicker(query);
  const update = useUpdateTicket();

  const handleClose = () => {
    if (update.isPending) return;
    setQuery("");
    setPickedId(currentAdminId ?? null);
    onOpenChange(false);
  };

  const handleAssign = async () => {
    if (!pickedId) return;
    try {
      await update.mutateAsync({ ticketId, assignedAdminId: pickedId });
      toast.success("Ticket assigned");
      onAssigned?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign ticket");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign admin</DialogTitle>
          <DialogDescription>
            Pick who owns this ticket. Assignment can be changed later.
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
            ) : options.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No matching admins.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {options.map((a) => {
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
                        {picked && <ShieldCheck className="h-4 w-4 text-[#00695C]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!pickedId || update.isPending || pickedId === currentAdminId}
          >
            {update.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            {currentAdminId ? "Reassign" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
